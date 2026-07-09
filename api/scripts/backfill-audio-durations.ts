// One-shot script: walks every excursion / city / place in Mongo, probes
// every audio URL that doesn't have a stored duration yet, and writes the
// results back.
//
// Runs inside the same Nest module graph as the API so it reuses the
// probe service + connection config. Idempotent — re-running only probes
// slots that are still missing.
//
// Usage:
//   yarn workspace @guide-me-app/api script:backfill-audio-durations
// or (from api/):
//   yarn script:backfill-audio-durations
//
// Env: same as the API (MONGO_URI etc). Reads dotenv/.env like the app.
/* eslint-disable no-console */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AudioProbeService } from '../src/discover/audio-probe.service';
import { DiscoverRepository } from '../src/discover/discover.repository';
import {
  collectCityAudioSlots,
  collectExcursionAudioSlots,
  collectPlaceAudioSlots,
} from '../src/discover/audio-slot-collectors';
import { AudioDurationReconciler } from '../src/discover/audio-duration-reconciler';
import { getModelToken } from '@nestjs/mongoose';
import { DiscoverCity } from '../src/discover/schemas/discover-city.schema';
import { DiscoverExcursion } from '../src/discover/schemas/discover-excursion.schema';
import { DiscoverPlace } from '../src/discover/schemas/discover-place.schema';
import type { Model } from 'mongoose';

async function main() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule, {
      logger: ['warn', 'error', 'log'],
    });

  try {
    const repo = app.get(DiscoverRepository);
    const reconciler = app.get(AudioDurationReconciler);
    // Sanity check that the probe service resolves — surfaces DI issues
    // early rather than mid-loop.
    app.get(AudioProbeService);

    const cityModel = app.get<Model<DiscoverCity>>(
      getModelToken(DiscoverCity.name),
    );
    const excursionModel = app.get<Model<DiscoverExcursion>>(
      getModelToken(DiscoverExcursion.name),
    );
    const placeModel = app.get<Model<DiscoverPlace>>(
      getModelToken(DiscoverPlace.name),
    );

    const [cities, excursions, places] = await Promise.all([
      repo.findAllCitiesAdmin(),
      repo.findAllExcursionsAdmin(),
      repo.findAllPlacesAdmin(),
    ]);

    console.log(
      `Backfilling ${cities.length} cities, ${excursions.length} excursions, ${places.length} places...`,
    );

    // Cities.
    for (const c of cities) {
      const draft = { ...c };
      const slots = collectCityAudioSlots(draft, c);
      if (slots.length === 0) continue;
      await reconciler.reconcile(slots);
      await cityModel.updateOne(
        { slug: c.slug },
        { $set: { audioDurationMs: draft.audioDurationMs ?? {} } },
      );
      console.log(`  city ${c.slug} → ${JSON.stringify(draft.audioDurationMs)}`);
    }

    // Places.
    for (const p of places) {
      const draft = { ...p };
      const slots = collectPlaceAudioSlots(draft, p);
      if (slots.length === 0) continue;
      await reconciler.reconcile(slots);
      await placeModel.updateOne(
        { slug: p.slug },
        { $set: { audioDurationMs: draft.audioDurationMs ?? {} } },
      );
      console.log(
        `  place ${p.slug} → ${JSON.stringify(draft.audioDurationMs)}`,
      );
    }

    // Excursions (deep: stops, sub-stops, facts, outro).
    for (const e of excursions) {
      // Clone the sub-arrays so writer mutations don't leak between drafts.
      const draft = {
        ...e,
        stops: (e.stops ?? []).map((s) => ({
          ...s,
          subStops: (s.subStops ?? []).map((sub) => ({ ...sub })),
        })),
        interestingFacts: (e.interestingFacts ?? []).map((f) => ({ ...f })),
        outro: e.outro ? { ...e.outro } : undefined,
      } as unknown as typeof e;
      const slots = collectExcursionAudioSlots(draft, e);
      if (slots.length === 0) continue;
      await reconciler.reconcile(slots);
      // Overwrite the nested fields wholesale — Mongo $set supports this
      // as long as sub-schemas allow the shape (they do; audioDurationMs
      // is Partial<Record<Locale, number>>).
      await excursionModel.updateOne(
        { slug: e.slug },
        {
          $set: {
            stops: draft.stops,
            interestingFacts: draft.interestingFacts,
            outro: draft.outro,
          },
        },
      );
      const summary = {
        stops: draft.stops.map((s) => s.audioDurationMs),
        facts: draft.interestingFacts.map((f) => f.audioDurationMs),
        outro: draft.outro?.audioDurationMs,
      };
      console.log(`  excursion ${e.slug} → ${JSON.stringify(summary)}`);
    }

    console.log('Backfill complete.');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
