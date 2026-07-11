import { Injectable } from '@nestjs/common';
import type { PublicUsageStats } from '@guide-me-app/core';
import { RatingsRepository } from '../ratings/ratings.repository';
import { PostHogQueryService } from './posthog-query.service';

// HogQL aggregates for the marketing counters. Each query filters on the
// specific event name the mobile app emits. Sums/counts across ALL time
// — no date filter — matches the "cumulative all-time" product decision.
//
// Distinct-user counts on `user_signup` rather than any event so anonymous
// pre-signup activity doesn't inflate the number. `user_signup` is fired
// exactly once per Clerk userId by the mobile IdentityGate.
const HOGQL_USERS = `SELECT count() FROM events WHERE event = 'user_signup'`;

// Sum of `duration_ms` across every `audio_played` event. HogQL exposes
// event properties via `properties.<name>`. Cast to a number so string-
// typed props still sum. Falls back to 0 if the column type is unknown.
const HOGQL_AUDIO_MS = `
  SELECT sum(toFloat(properties.duration_ms))
  FROM events
  WHERE event = 'audio_played' AND properties.duration_ms IS NOT NULL
`;

const HOGQL_ROUTES = `SELECT count() FROM events WHERE event = 'excursion_completed'`;

// Distinct country codes across every event PostHog has ingested. PostHog
// auto-attaches $geoip_country_code to events from its edge — no client
// instrumentation needed. Empty string / null values are filtered so an
// unresolved GeoIP doesn't get counted as a "country".
const HOGQL_COUNTRIES = `
  SELECT count(DISTINCT properties.$geoip_country_code)
  FROM events
  WHERE properties.$geoip_country_code IS NOT NULL
    AND properties.$geoip_country_code != ''
`;

// Number of times users consulted the weather forecast. Emitted by
// WeatherBanner on mobile whenever a real forecast renders. Cumulative
// across all time — matches the same "cumulative all-time" product
// decision as the other counters.
const HOGQL_WEATHER_CHECKS = `SELECT count() FROM events WHERE event = 'weather_checked'`;

@Injectable()
export class UsageStatsService {
  constructor(
    private readonly ph: PostHogQueryService,
    private readonly ratingsRepo: RatingsRepository,
  ) {}

  // Runs the PostHog aggregates in parallel, plus one Mongo aggregate for
  // the rating average (authoritative — includes anonymized rows). Any
  // PostHog query that fails resolves to 0; the Mongo aggregate returns
  // {sum: 0, count: 0} on empty. Ratings live in Mongo not PostHog so the
  // number is accurate from day one, even before analytics ships.
  async getUsageStats(): Promise<PublicUsageStats> {
    const [users, audioMs, routes, countries, weatherChecks, ratingsAgg] =
      await Promise.all([
        this.ph.querySingleNumber(HOGQL_USERS),
        this.ph.querySingleNumber(HOGQL_AUDIO_MS),
        this.ph.querySingleNumber(HOGQL_ROUTES),
        this.ph.querySingleNumber(HOGQL_COUNTRIES),
        this.ph.querySingleNumber(HOGQL_WEATHER_CHECKS),
        this.ratingsRepo.computeGlobalAggregate(),
      ]);
    const avg =
      ratingsAgg.count > 0
        ? Math.round((ratingsAgg.sum / ratingsAgg.count) * 10) / 10
        : 0;
    return {
      users: users ?? 0,
      audioListenedHours: Math.round(((audioMs ?? 0) as number) / 3_600_000),
      routesCompleted: routes ?? 0,
      countriesReached: countries ?? 0,
      averageRating: avg,
      ratingsCount: ratingsAgg.count,
      weatherChecks: weatherChecks ?? 0,
    };
  }
}
