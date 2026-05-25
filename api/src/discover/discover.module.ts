import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../cache/cache.module';
import { DiscoverController } from './discover.controller';
import { DiscoverCacheInterceptor } from './discover.interceptor';
import { DiscoverRepository } from './discover.repository';
import { DiscoverService } from './discover.service';
import {
  DiscoverCity,
  DiscoverCitySchema,
} from './schemas/discover-city.schema';
import {
  DiscoverExcursion,
  DiscoverExcursionSchema,
} from './schemas/discover-excursion.schema';
import {
  DiscoverPlace,
  DiscoverPlaceSchema,
} from './schemas/discover-place.schema';

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      { name: DiscoverCity.name, schema: DiscoverCitySchema },
      { name: DiscoverExcursion.name, schema: DiscoverExcursionSchema },
      { name: DiscoverPlace.name, schema: DiscoverPlaceSchema },
    ]),
  ],
  controllers: [DiscoverController],
  providers: [DiscoverService, DiscoverRepository, DiscoverCacheInterceptor],
  exports: [DiscoverRepository], // exposed so the seed script can use it
})
export class DiscoverModule {}
