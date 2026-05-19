import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Coordinates, WalkingDirectionsResponse } from '@guide-me-app/core';
import { CacheService } from '../cache/cache.service';

const GOOGLE_DIRECTIONS_URL =
  'https://maps.googleapis.com/maps/api/directions/json';

// Round to 5 decimal places (~1.1m precision at the equator) so near-identical
// requests share a cache slot. Higher precision multiplies cache miss rate
// without improving the polyline meaningfully.
const COORD_PRECISION = 5;

// Walking routes are stable for a given pair of points; cache aggressively.
// 30 days is fine — roads don't move.
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly apiKey = process.env.GOOGLE_DIRECTIONS_API_KEY;

  constructor(private readonly cache: CacheService) {
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_DIRECTIONS_API_KEY is not set. /public/directions/walk will return 503.',
      );
    }
  }

  async getWalkingRoute(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<WalkingDirectionsResponse> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Directions service is not configured.',
      );
    }

    const cacheKey = this.buildCacheKey(origin, destination);
    const cached = (await this.cache.getCache(cacheKey)) as
      | WalkingDirectionsResponse
      | undefined;
    if (cached) {
      return { ...cached, cached: true };
    }

    const url =
      `${GOOGLE_DIRECTIONS_URL}?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=walking&key=${this.apiKey}`;

    let json: any;
    try {
      const res = await fetch(url);
      json = await res.json();
    } catch (err) {
      this.logger.error(`Directions fetch failed: ${err}`);
      throw new ServiceUnavailableException(
        'Upstream directions provider unreachable.',
      );
    }

    if (json.status === 'ZERO_RESULTS') {
      // Walking route does not exist (e.g. coordinates too far apart).
      throw new HttpException(
        { message: 'No walking route found between those points.' },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (json.status !== 'OK' || !json.routes?.length) {
      this.logger.error(
        `Directions returned ${json.status}: ${json.error_message ?? '(no message)'}`,
      );
      // Don't leak Google's error messages to the client.
      throw new InternalServerErrorException(
        'Failed to compute walking route.',
      );
    }

    const route = json.routes[0];
    const leg = route.legs[0];
    const response: WalkingDirectionsResponse = {
      polyline: this.decodePolyline(route.overview_polyline.points),
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
      cached: false,
    };

    await this.cache.setCache(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  }

  private buildCacheKey(origin: Coordinates, destination: Coordinates): string {
    const olat = origin.latitude.toFixed(COORD_PRECISION);
    const olng = origin.longitude.toFixed(COORD_PRECISION);
    const dlat = destination.latitude.toFixed(COORD_PRECISION);
    const dlng = destination.longitude.toFixed(COORD_PRECISION);
    return `directions:walk:${olat},${olng}:${dlat},${dlng}`;
  }

  // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  private decodePolyline(encoded: string): Coordinates[] {
    const points: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let b: number;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      result = 0;
      shift = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  }
}
