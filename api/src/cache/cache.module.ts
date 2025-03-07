import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ScheduleModule } from '@nestjs/schedule';
import { createCache } from 'cache-manager';
import { CacheRefresherService } from './cache-refresher/cache-refresher.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    {
      provide: 'CACHE_MANAGER',
      useFactory: async () => {
        return createCache({ ttl: 3600 });
      },
    },
    CacheService,
    CacheRefresherService,
  ],
  exports: [CacheService, CacheRefresherService, 'CACHE_MANAGER'],
})
export class CacheModule {}
