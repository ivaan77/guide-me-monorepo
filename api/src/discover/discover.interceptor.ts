import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import { parseAcceptLanguage } from './locale.util';

const ONE_HOUR_MS = 60 * 60 * 1000;
export const DISCOVER_CACHE_PREFIX = 'discover:';

@Injectable()
export class DiscoverCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DiscoverCacheInterceptor.name);

  constructor(private readonly cache: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    const locale = parseAcceptLanguage(request.headers['accept-language']);
    const cacheKey = `${DISCOVER_CACHE_PREFIX}${request.path}:${locale}`;

    return from(this.cache.getCache<unknown>(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached !== undefined) {
          this.logger.debug?.(`HIT  ${cacheKey}`);
          return of(cached);
        }
        return next.handle().pipe(
          tap((payload) => {
            void this.cache.setCache(cacheKey, payload, ONE_HOUR_MS);
            this.logger.debug?.(`MISS ${cacheKey}`);
          }),
        );
      }),
    );
  }
}
