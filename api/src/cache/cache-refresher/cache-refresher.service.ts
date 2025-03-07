import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CacheService } from '../cache.service';

@Injectable()
export class CacheRefresherService implements OnModuleInit {
  constructor(private readonly cacheService: CacheService) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  @Cron('0 0 * * * *')
  async refreshCache() {
    const data = {};
    await this.cacheService.setCache('your_data_key', data);
    console.log('🔄Cache refreshed at %s', new Date().toLocaleTimeString());
  }

  async manualRefresh() {
    await this.refreshCache();
  }
}
