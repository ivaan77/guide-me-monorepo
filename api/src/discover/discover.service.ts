import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AllPublicCitiesResponse,
  Locale,
  PublicCategoryItem,
  PublicCity,
  PublicCityDetail,
  PublicCityDetailResponse,
  PublicEditorPick,
  PublicExcursion,
  PublicExcursionResponse,
  PublicExcursionStop,
  PublicPlaceDetail,
  PublicPlaceResponse,
  PublicPoi,
} from '@guide-me-app/core';
import { DiscoverRepository } from './discover.repository';
import { DiscoverCityDocument } from './schemas/discover-city.schema';
import { DiscoverExcursionDocument } from './schemas/discover-excursion.schema';
import { DiscoverPlaceDocument } from './schemas/discover-place.schema';
import { pickLocalized } from './locale.util';

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

    // 4 parallel queries: excursions summary + 3 place categories.
    const [excursions, restaurants, bars, shopping] = await Promise.all([
      this.repo.findEnabledExcursionSummariesForCity(id),
      this.repo.findEnabledPlacesForCity(id, 'restaurant'),
      this.repo.findEnabledPlacesForCity(id, 'bar'),
      this.repo.findEnabledPlacesForCity(id, 'shopping'),
    ]);

    const detail: PublicCityDetail = {
      ...this.toPublicCity(city, locale),
      excursions: excursions.map((e) => ({
        id: e.slug,
        name: pickLocalized(e.name, locale),
        meta: pickLocalized(e.meta, locale),
        image: e.image,
      })),

      restaurants: restaurants.map((p) => this.toPublicCategoryItem(p, locale)),
      bars: bars.map((p) => this.toPublicCategoryItem(p, locale)),
      shopping: shopping.map((p) => this.toPublicCategoryItem(p, locale)),
    };

    return { city: detail, locale };
  }

  async getExcursionById(
    id: string,
    locale: Locale,
  ): Promise<PublicExcursionResponse> {
    const excursion = await this.repo.findEnabledExcursionBySlug(id);
    if (!excursion) throw new NotFoundException(`Excursion not found: ${id}`);
    return {
      excursion: this.toPublicExcursion(excursion, locale),
      locale,
    };
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
    };
  }

  private toPublicExcursion(
    doc: DiscoverExcursionDocument,
    locale: Locale,
  ): PublicExcursion {
    return {
      id: doc.slug,
      name: pickLocalized(doc.name, locale),
      meta: pickLocalized(doc.meta, locale),
      image: doc.image,
      stops: doc.stops.map((stop) => this.toPublicStop(stop, locale)),
      pois: doc.pois?.map((poi) => this.toPublicPoi(poi, locale)),
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
      audioUrl: stop.audioUrl,
    };
  }

  private toPublicPoi(
    poi: NonNullable<DiscoverExcursionDocument['pois']>[number],
    locale: Locale,
  ): PublicPoi {
    return {
      id: poi.slug,
      order: poi.order,
      name: pickLocalized(poi.name, locale),
      category: poi.category,
      description: pickLocalized(poi.description, locale),
      coords: poi.coords,
      image: poi.image,
      images: poi.images,
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
    };
  }
}
