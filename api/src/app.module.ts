import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import mongoose from 'mongoose';
import 'dotenv/config';

mongoose.set('strictQuery', true);
import { AdminDiscoverModule } from './admin/discover/admin-discover.module';
import { CityModule } from './city/city.module';
import { TourModule } from './tour/tour.module';
import { CacheModule } from './cache/cache.module';
import { DirectionsModule } from './directions/directions.module';
import { DiscoverModule } from './discover/discover.module';

const dbUrl = process.env.MONGODB_URL;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    TourModule,
    CityModule,
    CacheModule,
    DirectionsModule,
    DiscoverModule,
    AdminDiscoverModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
