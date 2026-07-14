import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import mongoose from 'mongoose';
import 'dotenv/config';

mongoose.set('strictQuery', true);
import { AdminBlogModule } from './admin/blog/admin-blog.module';
import { AdminDiscoverModule } from './admin/discover/admin-discover.module';
import { AdminImageGalleryModule } from './admin/image-gallery/admin-image-gallery.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BlogModule } from './blog/blog.module';
import { CacheModule } from './cache/cache.module';
import { DirectionsModule } from './directions/directions.module';
import { DiscoverModule } from './discover/discover.module';
import { RatingsModule } from './ratings/ratings.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';

const dbUrl = process.env.MONGODB_URL;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    CacheModule,
    DirectionsModule,
    DiscoverModule,
    AdminDiscoverModule,
    AnalyticsModule,
    BlogModule,
    AdminBlogModule,
    AdminImageGalleryModule,
    RatingsModule,
    UsersModule,
    WeatherModule,
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
