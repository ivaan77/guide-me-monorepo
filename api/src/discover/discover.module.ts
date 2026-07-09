import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../cache/cache.module';
import { AudioDurationReconciler } from './audio-duration-reconciler';
import { AudioProbeService } from './audio-probe.service';
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
  providers: [
    DiscoverService,
    DiscoverRepository,
    DiscoverCacheInterceptor,
    AudioProbeService,
    AudioDurationReconciler,
  ],
  // Shared with AdminDiscoverModule (repository + reconciler) and any future
  // consumer that needs to probe audio (backfill CLI, etc).
  exports: [DiscoverRepository, AudioProbeService, AudioDurationReconciler],
})
export class DiscoverModule {}
