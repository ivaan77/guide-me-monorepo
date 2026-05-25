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
        // cache-manager v6 expects TTL in milliseconds. Default to 1 hour;
        // callers can override per-set via CacheService.setCache(key, val, ttlMs).
        return createCache({ ttl: 60 * 60 * 1000 });
      },
    },
    CacheService,
    CacheRefresherService,
  ],
  exports: [CacheService, CacheRefresherService, 'CACHE_MANAGER'],
})
export class CacheModule {}
