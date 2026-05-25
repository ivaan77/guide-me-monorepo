import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import mongoose from 'mongoose';
import 'dotenv/config';

mongoose.set('strictQuery', true);
import { AdminDiscoverModule } from './admin/discover/admin-discover.module';
import { CacheModule } from './cache/cache.module';
import { DirectionsModule } from './directions/directions.module';
import { DiscoverModule } from './discover/discover.module';
import { UsersModule } from './users/users.module';

const dbUrl = process.env.MONGODB_URL;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    CacheModule,
    DirectionsModule,
    DiscoverModule,
    AdminDiscoverModule,
    UsersModule,
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
