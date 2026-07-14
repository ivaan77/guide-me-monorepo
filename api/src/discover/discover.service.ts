import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AllPublicCitiesResponse,
  DEFAULT_LOCALE,
  Locale,
  PoiCategory,
  PublicCategoryItem,
  PublicCity,
  PublicCityDetail,
  PublicCityDetailResponse,
  PublicEditorPick,
  PublicExcursion,
  PublicExcursionOutro,
  PublicExcursionResponse,
  PublicExcursionStop,
  PublicGalleryItem,
  PublicGalleryResponse,
  PublicInterestingFact,
  PublicPlaceDetail,
  PublicPlaceResponse,
  PublicPoi,
  PublicRatingAggregate,
  PublicStats,
  PublicStatsResponse,
  PublicSubStop,
  SUPPORTED_LOCALES,
} from '@guide-me-app/core';
import type {
  LocalizedAudioDurationSub,
  LocalizedAudioSub,
} from './schemas/locale.subdocuments';
import { DiscoverCityDocument } from './schemas/discover-city.schema';
import { DiscoverExcursionDocument } from './schemas/discover-excursion.schema';
import {
  DiscoverPlaceDocument,
  PLACE_CATEGORIES,
} from './schemas/discover-place.schema';
import { DiscoverRepository } from './discover.repository';
import { pickLocalized } from './locale.util';

// Resolve a localized audio URL: prefer requested locale, fall back to en,
// then to any other populated locale. Returns undefined if no audio at all.
function resolveAudio(
  audio: LocalizedAudioSub | undefined,
  locale: Locale,
): string | undefined {
  if (!audio) return undefined;
  return audio[locale] ?? audio.en ?? audio.de ?? audio.hr ?? undefined;
}

// Derive the public aggregate from denormalized ratingSum/ratingCount.
// Returns undefined when there are no ratings — the response leaves the
// `rating` field off entirely so mobile can hide the badge.
function toRatingAggregate(doc: {
  ratingSum?: number;
  ratingCount?: number;
}): PublicRatingAggregate | undefined {
  const count = doc.ratingCount ?? 0;
  if (count === 0) return undefined;
  const sum = doc.ratingSum ?? 0;
  return { avg: Math.round((sum / count) * 10) / 10, count };
}

@Injectable()
export class DiscoverService {
  constructor(private readonly repo: DiscoverRepository) {}

  async getAllCities(locale: Locale): Promise<AllPublicCitiesResponse> {
    const cities = await this.repo.findAllEnabledCities();
    return {
      cities: cities.map((doc) => this.toPublicCity(doc, locale)),
      locale,
    };
  }

  async getCityById(
    id: string,
    locale: Locale,
  ): Promise<PublicCityDetailResponse> {
    const city = await this.repo.findEnabledCityBySlug(id);
    if (!city) throw new NotFoundException(`City not found: ${id}`);

    // Two parallel fetches: excursion summaries and the places the city
    // explicitly lists. We then bucket places by category in-memory rather
    // than firing six separate queries (one per category).
    const [excursions, places] = await Promise.all([
      this.repo.findEnabledExcursionSummariesForCity(id),
      this.repo.findEnabledPlacesBySlugs(city.cityPlaceSlugs ?? []),
    ]);

    // Preserve the editor-chosen ordering of cityPlaceSlugs (find returns
    // docs in arbitrary order). Filtering missing slugs here makes the
    // response silently drop disabled or deleted places.
    const slugOrder = new Map(
      (city.cityPlaceSlugs ?? []).map((slug, i) => [slug, i] as const),
    );
    const orderedPlaces = [...places].sort(
      (a, b) =>
        (slugOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
        (slugOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
    );

    const bucket = (category: PoiCategory): PublicCategoryItem[] =>
      orderedPlaces
        .filter((p) => p.category === category)
        .map((p) => this.toPublicCategoryItem(p, locale));

    const detail: PublicCityDetail = {
      ...this.toPublicCity(city, locale),
      audioUrl: resolveAudio(city.audioUrl, locale),
      excursions: excursions.map((e) => ({
        id: e.slug,
        name: pickLocalized(e.name, locale),
        meta: pickLocalized(e.meta, locale),
        image: e.image,
        rating: toRatingAggregate(e),
        // First-stop coord + sensitivity so mobile can render a compact
        // weather badge on the row without a second round-trip. Falls
        // back to 'outdoor' for the same defensive reason as the excursion
        // detail projection.
        coords: e.stops?.[0]?.coords,
        weatherSensitivity: e.weatherSensitivity ?? 'outdoor',
      })),
      restaurants: bucket('restaurant'),
      cafes: bucket('cafe'),
      pastries: bucket('pastry'),
      brunches: bucket('brunch'),
      bars: bucket('bar'),
      shopping: bucket('shopping'),
      events: bucket('event'),
      parks: bucket('park'),
      museums: bucket('museum'),
      viewpoints: bucket('viewpoint'),
      locals: bucket('local'),
      workshops: bucket('workshop'),
      playareas: bucket('playarea'),
      petFriendly: bucket('petFriendly'),
      kidsFriendly: bucket('kidsFriendly'),
    };

    return { city: detail, locale };
  }

  async getExcursionById(
    id: string,
    locale: Locale,
  ): Promise<PublicExcursionResponse> {
    const excursion = await this.repo.findEnabledExcursionBySlug(id);
    if (!excursion) throw new NotFoundException(`Excursion not found: ${id}`);

    // Dereference the POI refs into full Place docs so mobile can render
    // them inline alongside stops.
    const poiSlugs = (excursion.pois ?? []).map((p) => p.placeSlug);
    const placeDocs = await this.repo.findEnabledPlacesBySlugs(poiSlugs);
    const placesBySlug = new Map(placeDocs.map((p) => [p.slug, p] as const));

    const resolvedPois: PublicPoi[] = (excursion.pois ?? [])
      .map((ref) => {
        const place = placesBySlug.get(ref.placeSlug);
        if (!place) return null;
        return this.toPublicPoi(place, ref.order, locale);
      })
      .filter((p): p is PublicPoi => p !== null)
      .sort((a, b) => a.order - b.order);

    const resolvedFacts: PublicInterestingFact[] = (
      excursion.interestingFacts ?? []
    )
      .map((fact): PublicInterestingFact | null => {
        const audioUrl = resolveAudio(fact.audioUrl, locale);
        if (!audioUrl) return null;
        return {
          id: fact.slug,
          title: pickLocalized(fact.title, locale),
          audioUrl,
          coords: fact.coords,
          triggerRadius: fact.triggerRadius,
        };
      })
      .filter((f): f is PublicInterestingFact => f !== null);

    const outro: PublicExcursionOutro | undefined = excursion.outro
      ? {
          title: pickLocalized(excursion.outro.title, locale),
          description: pickLocalized(excursion.outro.description, locale),
          image: excursion.outro.image,
          images: excursion.outro.images,
          audioUrl: resolveAudio(excursion.outro.audioUrl, locale),
        }
      : undefined;

    const publicExcursion: PublicExcursion = {
      id: excursion.slug,
      name: pickLocalized(excursion.name, locale),
      meta: pickLocalized(excursion.meta, locale),
      image: excursion.image,
      stops: [...excursion.stops]
        .sort((a, b) => a.order - b.order)
        .map((stop) => this.toPublicStop(stop, locale)),
      pois: resolvedPois.length > 0 ? resolvedPois : undefined,
      interestingFacts: resolvedFacts.length > 0 ? resolvedFacts : undefined,
      outro,
      rating: toRatingAggregate(excursion),
      // Same 'outdoor' fallback as the admin path — belt-and-suspenders.
      weatherSensitivity: excursion.weatherSensitivity ?? 'outdoor',
    };

    return { excursion: publicExcursion, locale };
  }

  async getPlaceById(id: string, locale: Locale): Promise<PublicPlaceResponse> {
    const place = await this.repo.findEnabledPlaceBySlug(id);
    if (!place) throw new NotFoundException(`Place not found: ${id}`);
    return { place: this.toPublicPlace(place, locale), locale };
  }

  // ----- Public web (stats + gallery) -----

  async getWebStats(): Promise<PublicStatsResponse> {
    const [cities, excursions, places] = await Promise.all([
      this.repo.findAllEnabledCities(),
      this.repo.findAllEnabledExcursions(),
      this.repo.findAllEnabledPlaces(),
    ]);

    const placesByCategory = countPlacesByCategory(places);
    const excursionStops = excursions.reduce(
      (sum, e) => sum + (e.stops?.length ?? 0),
      0,
    );
    const audioDurationMs =
      sumAudioDuration({ cities, excursions, places }) ?? 0;

    const stats: PublicStats = {
      cities: cities.length,
      excursions: excursions.length,
      excursionStops,
      places: places.length,
      placesByCategory,
      audioDurationMs,
    };
    return { stats };
  }

  async getWebGallery(): Promise<PublicGalleryResponse> {
    const [cities, places] = await Promise.all([
      this.repo.findWebFeaturedCities(),
      this.repo.findWebFeaturedPlaces(),
    ]);
    // Merge cities and places into one list sorted by webFeaturedOrder (asc)
    // then slug. English is used for title/subtitle — the web landing is not
    // localized.
    type Row = { item: PublicGalleryItem; order: number };
    const rows: Row[] = [
      ...cities.map(
        (c): Row => ({
          item: {
            id: c.slug,
            sourceType: 'city',
            title: pickLocalized(c.name, DEFAULT_LOCALE),
            subtitle: pickLocalized(c.country, DEFAULT_LOCALE),
            image: c.image,
          },
          order: c.webFeaturedOrder ?? 0,
        }),
      ),
      ...places.map(
        (p): Row => ({
          item: {
            id: p.slug,
            sourceType: 'place',
            title: pickLocalized(p.name, DEFAULT_LOCALE),
            subtitle: pickLocalized(p.meta, DEFAULT_LOCALE),
            image: p.image,
          },
          order: p.webFeaturedOrder ?? 0,
        }),
      ),
    ].sort((a, b) => a.order - b.order || a.item.id.localeCompare(b.item.id));

    return { items: rows.map((r) => r.item) };
  }

  // ----- Mappers -----

  private toPublicCity(doc: DiscoverCityDocument, locale: Locale): PublicCity {
    return {
      id: doc.slug,
      image: doc.image,
      name: pickLocalized(doc.name, locale),
      country: pickLocalized(doc.country, locale),
      editorPick: doc.editorPick
        ? this.resolveEditorPick(doc.editorPick, locale)
        : undefined,
      rating: toRatingAggregate(doc),
    };
  }

  private resolveEditorPick(
    pick: NonNullable<DiscoverCityDocument['editorPick']>,
    locale: Locale,
  ): PublicEditorPick {
    return {
      headline: pickLocalized(pick.headline, locale),
      tagline: pickLocalized(pick.tagline, locale),
    };
  }

  private toPublicCategoryItem(
    doc: DiscoverPlaceDocument,
    locale: Locale,
  ): PublicCategoryItem {
    return {
      id: doc.slug,
      name: pickLocalized(doc.name, locale),
      meta: pickLocalized(doc.meta, locale),
      image: doc.image,
      description: doc.description
        ? pickLocalized(doc.description, locale)
        : undefined,
      images: doc.images,
      subCategory: doc.subCategory
        ? pickLocalized(doc.subCategory, locale)
        : undefined,
      rating: toRatingAggregate(doc),
      // Feeds client-side "distance from me" sort on CityDetailScreen.
      // Optional at the type level since legacy docs may lack coords.
      coords: doc.coords,
    };
  }

  private toPublicStop(
    stop: DiscoverExcursionDocument['stops'][number],
    locale: Locale,
  ): PublicExcursionStop {
    // Bundle handling: if subStops is non-empty, we serialize them and the
    // mobile app ignores the parent's audioUrl. The parent's coords +
    // triggerRadius still drive arrival detection.
    const subStops: PublicSubStop[] = (stop.subStops ?? []).map((sub) => ({
      id: sub.slug,
      name: pickLocalized(sub.name, locale),
      description: pickLocalized(sub.description, locale),
      coords: sub.coords,
      image: sub.image,
      images: sub.images,
      audioUrl: resolveAudio(sub.audioUrl, locale),
    }));
    return {
      id: stop.slug,
      order: stop.order,
      name: pickLocalized(stop.name, locale),
      description: pickLocalized(stop.description, locale),
      coords: stop.coords,
      image: stop.image,
      images: stop.images,
      audioUrl: resolveAudio(stop.audioUrl, locale),
      triggerRadius: stop.triggerRadius,
      subStops: subStops.length > 0 ? subStops : undefined,
    };
  }

  // Builds a PublicPoi from a Place doc + the excursion-side `order` value.
  // Places without coords would be useless on the map, so we substitute a
  // sentinel — but the migration backfills coords for everything we lift.
  private toPublicPoi(
    place: DiscoverPlaceDocument,
    order: number,
    locale: Locale,
  ): PublicPoi {
    return {
      id: place.slug,
      order,
      name: pickLocalized(place.name, locale),
      category: place.category,
      description: place.description
        ? pickLocalized(place.description, locale)
        : '',
      coords: place.coords ?? { latitude: 0, longitude: 0 },
      image: place.image,
      images: place.images,
      subCategory: place.subCategory
        ? pickLocalized(place.subCategory, locale)
        : undefined,
    };
  }

  private toPublicPlace(
    doc: DiscoverPlaceDocument,
    locale: Locale,
  ): PublicPlaceDetail {
    return {
      id: doc.slug,
      name: pickLocalized(doc.name, locale),
      meta: pickLocalized(doc.meta, locale),
      category: doc.category,
      image: doc.image,
      description: doc.description
        ? pickLocalized(doc.description, locale)
        : undefined,
      images: doc.images,
      coords: doc.coords,
      audioUrl: resolveAudio(doc.audioUrl, locale),
      subCategory: doc.subCategory
        ? pickLocalized(doc.subCategory, locale)
        : undefined,
      rating: toRatingAggregate(doc),
    };
  }
}

// ----- Aggregation helpers (used by public stats) -----

function countPlacesByCategory(
  places: DiscoverPlaceDocument[],
): Record<PoiCategory, number> {
  const out: Record<PoiCategory, number> = Object.fromEntries(
    PLACE_CATEGORIES.map((c) => [c, 0]),
  ) as Record<PoiCategory, number>;
  for (const p of places) {
    out[p.category as PoiCategory] = (out[p.category as PoiCategory] ?? 0) + 1;
  }
  return out;
}

// Sums the populated per-locale audio durations across every audio-bearing
// surface in every excursion, city, and place. Only counts a locale value if
// its paired URL is set on the same slot — protects against durations that
// linger after a URL is cleared. Every locale is counted independently, so
// a stop with en+de+hr audio contributes 3x the base duration.
function sumAudioDuration({
  cities,
  excursions,
  places,
}: {
  cities: DiscoverCityDocument[];
  excursions: DiscoverExcursionDocument[];
  places: DiscoverPlaceDocument[];
}): number {
  let total = 0;
  const add = (
    urls: LocalizedAudioSub | undefined,
    durations: LocalizedAudioDurationSub | undefined,
  ) => {
    if (!urls || !durations) return;
    for (const locale of SUPPORTED_LOCALES) {
      const url = urls[locale];
      const ms = durations[locale];
      if (url && typeof ms === 'number' && ms > 0) total += ms;
    }
  };
  for (const c of cities) add(c.audioUrl, c.audioDurationMs);
  for (const p of places) add(p.audioUrl, p.audioDurationMs);
  for (const e of excursions) {
    for (const s of e.stops ?? []) {
      add(s.audioUrl, s.audioDurationMs);
      for (const sub of s.subStops ?? []) {
        add(sub.audioUrl, sub.audioDurationMs);
      }
    }
    for (const f of e.interestingFacts ?? []) {
      add(f.audioUrl, f.audioDurationMs);
    }
    if (e.outro) add(e.outro.audioUrl, e.outro.audioDurationMs);
  }
  return total;
}
