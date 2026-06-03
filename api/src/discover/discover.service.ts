import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AllPublicCitiesResponse,
  Locale,
  PoiCategory,
  PublicCategoryItem,
  PublicCity,
  PublicCityDetail,
  PublicCityDetailResponse,
  PublicEditorPick,
  PublicExcursion,
  PublicExcursionResponse,
  PublicExcursionStop,
  PublicInterestingFact,
  PublicPlaceDetail,
  PublicPlaceResponse,
  PublicPoi,
} from '@guide-me-app/core';
import type { LocalizedAudioSub } from './schemas/locale.subdocuments';
import { DiscoverCityDocument } from './schemas/discover-city.schema';
import { DiscoverExcursionDocument } from './schemas/discover-excursion.schema';
import { DiscoverPlaceDocument } from './schemas/discover-place.schema';
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
      })),
      restaurants: bucket('restaurant'),
      cafes: bucket('cafe'),
      bars: bucket('bar'),
      shopping: bucket('shopping'),
      events: bucket('event'),
      parks: bucket('park'),
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
      .filter((p): p is PublicPoi => p !== null);

    const resolvedFacts: PublicInterestingFact[] = (
      excursion.interestingFacts ?? []
    )
      .map((fact) => {
        const audioUrl = resolveAudio(fact.audioUrl, locale);
        if (!audioUrl) return null;
        return {
          id: fact.slug,
          title: pickLocalized(fact.title, locale),
          audioUrl,
        };
      })
      .filter((f): f is PublicInterestingFact => f !== null);

    const publicExcursion: PublicExcursion = {
      id: excursion.slug,
      name: pickLocalized(excursion.name, locale),
      meta: pickLocalized(excursion.meta, locale),
      image: excursion.image,
      stops: excursion.stops.map((stop) => this.toPublicStop(stop, locale)),
      pois: resolvedPois.length > 0 ? resolvedPois : undefined,
      interestingFacts:
        resolvedFacts.length > 0 ? resolvedFacts : undefined,
    };

    return { excursion: publicExcursion, locale };
  }

  async getPlaceById(id: string, locale: Locale): Promise<PublicPlaceResponse> {
    const place = await this.repo.findEnabledPlaceBySlug(id);
    if (!place) throw new NotFoundException(`Place not found: ${id}`);
    return { place: this.toPublicPlace(place, locale), locale };
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
    };
  }

  private toPublicStop(
    stop: DiscoverExcursionDocument['stops'][number],
    locale: Locale,
  ): PublicExcursionStop {
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
    };
  }
}
