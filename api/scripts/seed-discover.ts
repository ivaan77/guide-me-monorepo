// Seeds the cities / excursions / places collections from CITY_RECORDS.
// Destructive by design: wipes the three collections first, then inserts.
//
// The seed data still authors excursion POIs inline for convenience. This
// script lifts each inline POI into the standalone places collection and
// references it back from the excursion (mirroring what the production
// migration script does on real data).
//
// Run with: yarn seed:discover

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import { AppModule } from '../src/app.module';
import { DiscoverRepository } from '../src/discover/discover.repository';
import {
  CITY_RECORDS,
  type ExcursionRecord,
} from '../src/discover/discover.data';
import { assertSafeDbForDestructiveOp } from '../src/scripts/db-safety';

const liftedPlaceSlug = (
  citySlug: string,
  excursionSlug: string,
  poiSlug: string,
): string => `${citySlug}-${excursionSlug}-${poiSlug}`;

async function main() {
  const logger = new Logger('SeedDiscover');
  // Refuses to run against the test DB unless explicitly allowed via env.
  assertSafeDbForDestructiveOp(mongoose.connection.name, logger);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const repo = app.get(DiscoverRepository);

    logger.log('Wiping cities, excursions, and places collections...');
    await repo.wipeAll();

    let cityCount = 0;
    let excursionCount = 0;
    let placeCount = 0;

    for (const city of CITY_RECORDS) {
      // Standalone city places — restaurants/bars/shopping listed under the
      // city itself. We collect their slugs to populate cityPlaceSlugs.
      const cityPlaceSlugs: string[] = [];

      const standalone = [
        { items: city.restaurants, category: 'restaurant' as const },
        { items: city.bars, category: 'bar' as const },
        { items: city.shopping, category: 'shopping' as const },
      ];

      for (const { items, category } of standalone) {
        for (const place of items ?? []) {
          await repo.insertPlace({
            slug: place.slug,
            citySlug: city.slug,
            category,
            name: place.name,
            meta: place.meta,
            image: place.image,
            description: place.description,
            images: place.images,
          });
          cityPlaceSlugs.push(place.slug);
          placeCount++;
        }
      }

      await repo.insertCity({
        slug: city.slug,
        image: city.image,
        name: city.name,
        country: city.country,
        editorPick: city.editorPick,
        cityPlaceSlugs,
      });
      cityCount++;

      for (const excursion of city.excursions ?? []) {
        const poiRefs = await liftExcursionPois(repo, city.slug, excursion);
        placeCount += poiRefs.length;

        // The legacy seed shape stores audioUrl as a single string; the
        // schema expects { en, de?, hr? }. Wrap on the fly.
        const stops = excursion.stops.map((s) => ({
          ...s,
          audioUrl: s.audioUrl ? { en: s.audioUrl } : undefined,
        }));

        await repo.insertExcursion({
          slug: excursion.slug,
          citySlug: city.slug,
          name: excursion.name,
          meta: excursion.meta,
          image: excursion.image,
          stops,
          pois: poiRefs,
        });
        excursionCount++;
      }
    }

    logger.log(
      `Seed complete: ${cityCount} cities, ${excursionCount} excursions, ${placeCount} places.`,
    );
  } catch (err) {
    new Logger('SeedDiscover').error('Seed failed', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

async function liftExcursionPois(
  repo: DiscoverRepository,
  citySlug: string,
  excursion: ExcursionRecord,
): Promise<Array<{ placeSlug: string; order: number }>> {
  const refs: Array<{ placeSlug: string; order: number }> = [];
  for (const poi of excursion.pois ?? []) {
    const placeSlug = liftedPlaceSlug(citySlug, excursion.slug, poi.slug);
    await repo.insertPlace({
      slug: placeSlug,
      citySlug,
      category: poi.category,
      name: poi.name,
      // No `meta` in source — reuse the name as a placeholder. Editors can
      // adjust in admin after seeding.
      meta: poi.name,
      image: poi.image,
      description: poi.description,
      images: poi.images,
      coords: poi.coords,
    });
    refs.push({ placeSlug, order: poi.order });
  }
  return refs;
}

main();
