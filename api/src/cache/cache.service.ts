import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

// cache-manager v6 treats `ttl` as milliseconds.
const ONE_HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class CacheService {
  // Tracks keys we've written, so resetByPrefix can iterate without leaning on
  // the underlying store's keys() API (not exposed by the wrapper).
  private readonly knownKeys = new Set<string>();

  constructor(@Inject('CACHE_MANAGER') private readonly cache: Cache) {}

  async setCache(key: string, data: any, ttlMs: number = ONE_HOUR_MS) {
    await this.cache.set(key, data, ttlMs);
    this.knownKeys.add(key);
  }

  async getCache<T = unknown>(key: string): Promise<T | undefined> {
    const value = await this.cache.get<T>(key);
    return value ?? undefined;
  }

  async resetCache(key: string) {
    await this.cache.del(key);
    this.knownKeys.delete(key);
  }

  // Delete every cached entry whose key begins with `prefix`. Useful when
  // content changes (e.g. an admin edits a city — invalidate all
  // `discover:city:lisbon:*` variants across locales).
  async resetByPrefix(prefix: string): Promise<number> {
    const matching = Array.from(this.knownKeys).filter((k) => k.startsWith(prefix));
    await Promise.all(matching.map((k) => this.cache.del(k)));
    for (const k of matching) this.knownKeys.delete(k);
    return matching.length;
  }
}
