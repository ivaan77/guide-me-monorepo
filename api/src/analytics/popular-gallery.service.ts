import { Injectable, Logger } from '@nestjs/common';
import type { PublicPopularItem } from '@guide-me-app/core';
import { DEFAULT_LOCALE } from '@guide-me-app/core';
import { DiscoverRepository } from '../discover/discover.repository';
import { PostHogQueryService } from './posthog-query.service';

// Max items surfaced per source type. Combined they yield up to 3× this
// on the endpoint response, which is fine for a single scrollable row on
// /gallery.
const TOP_N_PER_TYPE = 4;

// HogQL: excursion popularity = count of `excursion_started` per slug.
// `excursion_started` chosen over `excursion_completed` because starts are
// higher volume (better signal early) and reflect intent — the completed
// count trails starts by whatever the drop-off is.
const HOGQL_EXCURSIONS = `
  SELECT properties.excursion_id AS slug, count() AS n
  FROM events
  WHERE event = 'excursion_started' AND properties.excursion_id IS NOT NULL
  GROUP BY properties.excursion_id
  ORDER BY n DESC
  LIMIT ${TOP_N_PER_TYPE * 3}
`;

// City popularity = count of `excursion_started` grouped by the city slug
// derived from the excursion doc. HogQL can't join to Mongo, so we group
// by excursion here then re-aggregate by city on the API side after
// hydrating excursion → city_slug from Mongo.
const HOGQL_CITY_STARTS = `
  SELECT properties.excursion_id AS slug, count() AS n
  FROM events
  WHERE event = 'excursion_started' AND properties.excursion_id IS NOT NULL
  GROUP BY properties.excursion_id
`;

// Place popularity = count of favorite_toggled where added=true.
// `external_map_opened` would be another candidate but favorites capture
// intent better and aren't distorted by places-with-real-utility-value.
const HOGQL_PLACES = `
  SELECT properties.id AS slug, count() AS n
  FROM events
  WHERE event = 'favorite_toggled'
    AND properties.type = 'place'
    AND properties.added = true
    AND properties.id IS NOT NULL
  GROUP BY properties.id
  ORDER BY n DESC
  LIMIT ${TOP_N_PER_TYPE * 3}
`;

type PopularityRow = { slug: string; n: number };

@Injectable()
export class PopularGalleryService {
  private readonly logger = new Logger(PopularGalleryService.name);

  constructor(
    private readonly ph: PostHogQueryService,
    private readonly discoverRepo: DiscoverRepository,
  ) {}

  async getPopularItems(): Promise<PublicPopularItem[]> {
    if (!this.ph.isConfigured()) return [];

    const [excursionRows, cityStartRows, placeRows] = await Promise.all([
      this.queryRows(HOGQL_EXCURSIONS),
      this.queryRows(HOGQL_CITY_STARTS),
      this.queryRows(HOGQL_PLACES),
    ]);

    // Hydrate the excursion + place slugs into full docs so we can project
    // title/image back into the response. Cities need a two-step: aggregate
    // excursion counts BY citySlug, then hydrate cities.
    const excursionSlugs = excursionRows.map((r) => r.slug);
    const placeSlugs = placeRows.map((r) => r.slug);

    const [excursions, places] = await Promise.all([
      excursionSlugs.length
        ? this.discoverRepo.findEnabledExcursionsBySlugs(excursionSlugs)
        : [],
      placeSlugs.length
        ? this.discoverRepo.findEnabledPlacesBySlugs(placeSlugs)
        : [],
    ]);

    // Roll per-excursion counts up into per-city totals via a Mongo lookup
    // (we need to know citySlug for each started excursion). Fetch just
    // the docs we've already seen — no wasted queries.
    const cityStartLookup = new Map<string, number>();
    const allExcursionSlugsWithStarts = cityStartRows.map((r) => r.slug);
    const excursionCityLookup = allExcursionSlugsWithStarts.length
      ? await this.discoverRepo.findEnabledExcursionsBySlugs(
          allExcursionSlugsWithStarts,
        )
      : [];
    const excursionToCity = new Map(
      excursionCityLookup.map((e) => [e.slug, e.citySlug] as const),
    );
    for (const row of cityStartRows) {
      const citySlug = excursionToCity.get(row.slug);
      if (!citySlug) continue;
      cityStartLookup.set(
        citySlug,
        (cityStartLookup.get(citySlug) ?? 0) + row.n,
      );
    }
    const cityScores: PopularityRow[] = [...cityStartLookup.entries()]
      .map(([slug, n]) => ({ slug, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, TOP_N_PER_TYPE * 3);
    const cities = cityScores.length
      ? await this.discoverRepo.findEnabledCitiesBySlugs(
          cityScores.map((c) => c.slug),
        )
      : [];

    // Assemble PublicPopularItem[] for each source type, keeping only
    // items that resolved to a live enabled doc. Disabled or deleted
    // entities silently drop out — they'd 404 on the frontend anyway.
    const excursionsBySlug = new Map(excursions.map((e) => [e.slug, e] as const));
    const placesBySlug = new Map(places.map((p) => [p.slug, p] as const));
    const citiesBySlug = new Map(cities.map((c) => [c.slug, c] as const));

    const items: PublicPopularItem[] = []

    for (const row of excursionRows.slice(0, TOP_N_PER_TYPE)) {
      const doc = excursionsBySlug.get(row.slug);
      if (!doc) continue;
      items.push({
        id: doc.slug,
        sourceType: 'excursion',
        title: doc.name?.[DEFAULT_LOCALE] ?? doc.slug,
        subtitle: doc.meta?.[DEFAULT_LOCALE],
        image: doc.image,
        popularity: row.n,
        popularityKind: 'walkers',
      });
    }
    for (const row of cityScores.slice(0, TOP_N_PER_TYPE)) {
      const doc = citiesBySlug.get(row.slug);
      if (!doc) continue;
      items.push({
        id: doc.slug,
        sourceType: 'city',
        title: doc.name?.[DEFAULT_LOCALE] ?? doc.slug,
        subtitle: doc.country?.[DEFAULT_LOCALE],
        image: doc.image,
        popularity: row.n,
        popularityKind: 'explorers',
      });
    }
    for (const row of placeRows.slice(0, TOP_N_PER_TYPE)) {
      const doc = placesBySlug.get(row.slug);
      if (!doc) continue;
      items.push({
        id: doc.slug,
        sourceType: 'place',
        title: doc.name?.[DEFAULT_LOCALE] ?? doc.slug,
        subtitle: doc.meta?.[DEFAULT_LOCALE],
        image: doc.image,
        popularity: row.n,
        popularityKind: 'saves',
      });
    }

    return items;
  }

  // Runs a HogQL query that returns rows of (slug, n) pairs. On any
  // failure returns [] so the endpoint gracefully degrades to "no popular
  // items right now."
  private async queryRows(hogql: string): Promise<PopularityRow[]> {
    const raw = await this.ph.queryRows(hogql);
    if (!raw) return [];
    const out: PopularityRow[] = [];
    for (const row of raw) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const slug = row[0];
      const n = Number(row[1]);
      if (typeof slug !== 'string' || !Number.isFinite(n)) continue;
      out.push({ slug, n });
    }
    return out;
  }
}
