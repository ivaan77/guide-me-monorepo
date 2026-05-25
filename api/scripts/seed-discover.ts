// Seeds the cities / excursions / places collections from CITY_RECORDS.
// Destructive by design: wipes the three collections first, then inserts.
// Idempotent across runs because slugs are stable.
//
// Run with: yarn seed:discover

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DiscoverRepository } from '../src/discover/discover.repository';
import { CITY_RECORDS } from '../src/discover/discover.data';

async function main() {
  const logger = new Logger('SeedDiscover');
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
      await repo.insertCity({
        slug: city.slug,
        image: city.image,
        name: city.name,
        country: city.country,
        editorPick: city.editorPick,
      });
      cityCount++;

      for (const excursion of city.excursions ?? []) {
        await repo.insertExcursion({
          slug: excursion.slug,
          citySlug: city.slug,
          name: excursion.name,
          meta: excursion.meta,
          image: excursion.image,
          stops: excursion.stops,
          pois: excursion.pois,
        });
        excursionCount++;
      }

      const categories = [
        { items: city.restaurants, category: 'restaurant' as const },
        { items: city.bars, category: 'bar' as const },
        { items: city.shopping, category: 'shopping' as const },
      ];

      for (const { items, category } of categories) {
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
          placeCount++;
        }
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

main();
