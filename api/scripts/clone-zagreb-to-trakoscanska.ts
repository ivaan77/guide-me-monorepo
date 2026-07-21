// One-shot restore: clone the source Zagreb excursion into a new
// `zagreb-trakoscanska-test` excursion with all pins relocated to
// Trakoscanska ul. so the route can be walk-tested end-to-end.
//
// What it does:
//   - Clones first 5 stops from `the-story-of-zagreb`
//   - Overwrites top-level stop coords with 5 points along Trakoscanska
//   - Overwrites sub-stop coords on the Ban Jelačić bundle (stop 1) with
//     small offsets around the parent pin so they still cluster together
//   - Sets `triggerRadius: 25 m` on top-level stops and sub-stops
//   - Repositions the 2 interestingFacts to mid-leg points along the
//     route with `triggerRadius: 30 m` so they fire while walking
//   - Preserves audio, images, names, descriptions from the source
//
// Idempotent: upserts on the target slug. Safe to re-run.
//
// Usage:
//   yarn workspace @guide-me-app/api script:clone-zagreb-to-trakoscanska
/* eslint-disable no-console */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { DiscoverExcursion } from '../src/discover/schemas/discover-excursion.schema';

const SOURCE_SLUG = 'the-story-of-zagreb';
const TARGET_SLUG = 'zagreb-trakoscanska-test';
const STOP_LIMIT = 5;
const STOP_TRIGGER_RADIUS_M = 25;
const FACT_TRIGGER_RADIUS_M = 30;

type LatLng = { latitude: number; longitude: number };

// Walking route north → south down Trakoscanska ul.
const STOP_COORDS: ReadonlyArray<LatLng> = [
  { latitude: 45.803961, longitude: 15.953023 },
  { latitude: 45.803604, longitude: 15.95319 },
  { latitude: 45.803173, longitude: 15.953301 },
  { latitude: 45.802718, longitude: 15.953378 },
  { latitude: 45.801973, longitude: 15.953396 },
];

// Sub-stops sit inside stop 1 (Ban Jelačić bundle). Cluster them within
// ~10 m of the parent pin so mobile shows them as a "bundle" with one
// arrival trigger and per-sub-stop pins on the map. Kept 4 slots since
// the source bundle has 4 sub-stops now.
const SUB_STOP_COORDS: ReadonlyArray<LatLng> = [
  { latitude: 45.80398, longitude: 15.95298 },
  { latitude: 45.80398, longitude: 15.95306 },
  { latitude: 45.80394, longitude: 15.95298 },
  { latitude: 45.80394, longitude: 15.95306 },
];

// Facts trigger while walking between stops. Coord positions chosen at
// mid-leg between adjacent stop pins.
const FACT_COORDS: ReadonlyArray<LatLng> = [
  { latitude: 45.8034, longitude: 15.95324 }, // between stops 2 & 3
  { latitude: 45.80295, longitude: 15.95334 }, // between stops 3 & 4
];

async function main() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule, {
      logger: ['warn', 'error', 'log'],
    });

  try {
    const excursionModel = app.get<Model<DiscoverExcursion>>(
      getModelToken(DiscoverExcursion.name),
    );

    const source: any = await excursionModel
      .findOne({ slug: SOURCE_SLUG })
      .lean()
      .exec();

    if (!source) {
      console.error(`Source excursion not found: slug="${SOURCE_SLUG}"`);
      process.exit(1);
    }

    console.log(`Source found: ${source.slug} (city=${source.citySlug})`);
    console.log(`  stops:            ${source.stops?.length ?? 0}`);
    console.log(`  interestingFacts: ${source.interestingFacts?.length ?? 0}`);

    const sourceStops = (source.stops ?? [])
      .slice()
      .sort((a: any, b: any) => a.order - b.order)
      .slice(0, STOP_LIMIT);

    const trimmedStops = sourceStops.map((stop: any, idx: number) => {
      const remapped: any = {
        ...stop,
        order: idx + 1,
        coords: STOP_COORDS[idx],
        triggerRadius: STOP_TRIGGER_RADIUS_M,
      };

      if (Array.isArray(stop.subStops) && stop.subStops.length > 0) {
        remapped.subStops = stop.subStops.map((sub: any, subIdx: number) => ({
          ...sub,
          coords:
            SUB_STOP_COORDS[subIdx] ??
            STOP_COORDS[idx], // fallback to parent pin if we run out
        }));
      }
      return remapped;
    });

    const trimmedFacts = (source.interestingFacts ?? []).map(
      (fact: any, idx: number) => ({
        ...fact,
        coords: FACT_COORDS[idx] ?? FACT_COORDS[FACT_COORDS.length - 1],
        triggerRadius: FACT_TRIGGER_RADIUS_M,
      }),
    );

    console.log(`Cloning ${trimmedStops.length} stop(s) into target.`);
    for (const s of trimmedStops) {
      console.log(
        `  stop ${s.order} slug=${s.slug} coords=${s.coords.latitude},${s.coords.longitude} subStops=${s.subStops?.length ?? 0}`,
      );
    }
    console.log(`Cloning ${trimmedFacts.length} interestingFact(s):`);
    for (const f of trimmedFacts) {
      console.log(
        `  fact slug=${f.slug.slice(0, 40)}... coords=${f.coords.latitude},${f.coords.longitude}`,
      );
    }

    const cloned = {
      slug: TARGET_SLUG,
      citySlug: source.citySlug,
      name: {
        en: 'Zagreb — Trakoscanska (test)',
        de: 'Zagreb — Trakoscanska (Test)',
        hr: 'Zagreb — Trakoscanska (test)',
      },
      meta: source.meta,
      image: source.image,
      stops: trimmedStops,
      pois: source.pois ?? [],
      interestingFacts: trimmedFacts,
      outro: source.outro,
      isEnabled: true,
      weatherSensitivity: source.weatherSensitivity ?? 'outdoor',
      ratingSum: 0,
      ratingCount: 0,
    };

    const existing = await excursionModel
      .findOne({ slug: TARGET_SLUG })
      .lean()
      .exec();

    if (existing) {
      await excursionModel
        .updateOne({ slug: TARGET_SLUG }, { $set: cloned })
        .exec();
      console.log(`Refreshed existing target: ${TARGET_SLUG}`);
    } else {
      await excursionModel.create(cloned);
      console.log(`Created target: ${TARGET_SLUG}`);
    }

    console.log('');
    console.log(`Done. Open ${TARGET_SLUG} in admin to verify.`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Clone failed:', err);
  process.exit(1);
});
