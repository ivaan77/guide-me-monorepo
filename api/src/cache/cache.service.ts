import { Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(@Inject('CACHE_MANAGER') private readonly cache: Cache) {}

  async setCache(key: string, data: any, ttl = 3600) {
    await this.cache.set(key, data, ttl);
  }

  async getCache(key: string) {
    return this.cache.get(key);
  }

  async resetCache(key: string) {
    await this.cache.del(key);
  }
}
