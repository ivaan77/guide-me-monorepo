import { Injectable, Logger } from '@nestjs/common';
import type { PublicWeather } from '@guide-me-app/core';
import { CacheService } from '../cache/cache.service';

// Talks to Open-Meteo's free forecast API and normalizes to our
// PublicWeather shape. Chosen because:
//   - Zero API key required (no signup, no rotation, nothing to rotate).
//   - Fair-use free for commercial <= ~10k req/day. Well under our
//     ceiling for a while.
//   - 7-day forecast at hourly + daily granularity. We use daily.
//
// If we outgrow the free tier or need SLA-backed data, WeatherAPI.com is
// the natural fallback: their /forecast.json returns a superset shape we
// could map to the same PublicWeather with minimal changes.
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// How long to cache a forecast for a specific (lat, lng, date). One hour
// matches the marketing-web cache TTL and Open-Meteo's own recommended
// polling cadence — forecasts don't change more than a few times a day.
const CACHE_TTL_MS = 60 * 60 * 1000;

// Per-request budget. Open-Meteo is normally <500ms but we don't want to
// hang a mobile preview screen if their edge is slow.
const REQUEST_TIMEOUT_MS = 4000;

// Cache-key prefix so admin cache-bust chains don't accidentally purge
// weather entries.
const WEATHER_CACHE_PREFIX = 'weather:';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly cache: CacheService) {}

  // Fetch daily forecast for one lat/lng/date. Returns null on any
  // failure — the endpoint layer decides whether to 404 or emit a
  // "weather unavailable" response. We never throw at this layer so a
  // temporary Open-Meteo blip can't break the mobile app.
  async getForecast(
    lat: number,
    lng: number,
    date: string,
  ): Promise<PublicWeather | null> {
    // Round coordinates to 4 decimals (~11m) so nearby stops share a
    // cache entry — Open-Meteo snaps to ~1km grid points anyway, so this
    // is fine for our use case.
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    const cacheKey = `${WEATHER_CACHE_PREFIX}${roundedLat},${roundedLng}:${date}`;

    const cached = await this.cache.getCache<PublicWeather>(cacheKey);
    if (cached !== undefined) return cached;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Ask Open-Meteo for the daily aggregates we care about. `timezone=auto`
      // makes them return values in the location's local timezone — critical
      // so "the date" matches what the user actually experiences.
      const url =
        `${OPEN_METEO_BASE}?latitude=${roundedLat}` +
        `&longitude=${roundedLng}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
        `&timezone=auto` +
        `&start_date=${date}&end_date=${date}`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        this.logger.warn(
          `Open-Meteo returned ${res.status} for ${roundedLat},${roundedLng}:${date}`,
        );
        return null;
      }

      const json = (await res.json()) as {
        latitude?: number;
        longitude?: number;
        daily?: {
          time?: string[];
          weather_code?: number[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          precipitation_sum?: number[];
          wind_speed_10m_max?: number[];
        };
      };

      const daily = json.daily;
      if (!daily?.time?.length) {
        this.logger.warn(`Open-Meteo returned empty daily block for ${date}`);
        return null;
      }

      // We asked for a single day, so index 0 is our answer.
      const weather: PublicWeather = {
        date: daily.time[0],
        resolvedLat: json.latitude ?? roundedLat,
        resolvedLng: json.longitude ?? roundedLng,
        tempMaxC: daily.temperature_2m_max?.[0] ?? 0,
        tempMinC: daily.temperature_2m_min?.[0] ?? 0,
        precipitationMm: daily.precipitation_sum?.[0] ?? 0,
        windKmh: daily.wind_speed_10m_max?.[0] ?? 0,
        weatherCode: daily.weather_code?.[0] ?? 0,
      };

      await this.cache.setCache(cacheKey, weather, CACHE_TTL_MS);
      return weather;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') {
        this.logger.warn(
          `Open-Meteo timeout for ${roundedLat},${roundedLng}:${date}`,
        );
      } else {
        this.logger.warn(`Open-Meteo fetch failed: ${(err as Error).message}`);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
