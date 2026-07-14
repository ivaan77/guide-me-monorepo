// One-shot migration: set weatherSensitivity='outdoor' on any excursion
// doc that doesn't already have the field. Idempotent — re-running is a
// no-op after the first successful run.
//
// Why 'outdoor' as the safe default:
//   Most walking-tour excursions are dominantly outside. Marking them
//   'outdoor' produces the most useful weather warnings by default;
//   admin edits the false positives (museum tours, covered bazaars) to
//   'mixed' or 'indoor' after the fact. Marking as 'mixed' would silence
//   the feature for true outdoor tours, which is worse.
//
// Usage:
//   yarn workspace @guide-me-app/api script:backfill-weather-sensitivity
/* eslint-disable no-console */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { DiscoverExcursion } from '../src/discover/schemas/discover-excursion.schema';
import type { Model } from 'mongoose';

async function main() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule, {
      logger: ['warn', 'error', 'log'],
    });

  try {
    const excursionModel = app.get<Model<DiscoverExcursion>>(
      getModelToken(DiscoverExcursion.name),
    );

    // Match docs where weatherSensitivity is missing OR null OR empty.
    // $exists:false catches never-set; $eq:null catches explicit null.
    const filter = {
      $or: [
        { weatherSensitivity: { $exists: false } },
        { weatherSensitivity: null },
        { weatherSensitivity: '' },
      ],
    };

    const before = await excursionModel.countDocuments(filter);
    console.log(`Found ${before} excursion(s) needing backfill.`);
    if (before === 0) {
      console.log('Nothing to backfill. Exiting.');
      return;
    }

    const result = await excursionModel.updateMany(filter, {
      $set: { weatherSensitivity: 'outdoor' },
    });
    console.log(
      `Backfilled ${result.modifiedCount} doc(s). Matched ${result.matchedCount}.`,
    );

    const after = await excursionModel.countDocuments(filter);
    if (after > 0) {
      console.log(
        `WARN: ${after} doc(s) still lack weatherSensitivity after update — investigate.`,
      );
    } else {
      console.log('All excursions now have weatherSensitivity set.');
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
