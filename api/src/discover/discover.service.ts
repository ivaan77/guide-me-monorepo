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
  PublicPlaceDetail,
  PublicPlaceResponse,
  PublicPoi,
} from '@guide-me-app/core';
import {
  CategoryItemRecord,
  CITY_RECORDS,
  CityRecord,
  ExcursionRecord,
  ExcursionStopRecord,
  PoiRecord,
  pickLocalized,
} from './discover.data';

@Injectable()
export class DiscoverService {
  async getAllCities(locale: Locale): Promise<AllPublicCitiesResponse> {
    return {
      cities: CITY_RECORDS.map((record) => this.toPublicCity(record, locale)),
      locale,
    };
  }

  async getCityById(
    id: string,
    locale: Locale,
  ): Promise<PublicCityDetailResponse> {
    const record = CITY_RECORDS.find((c) => c.slug === id);
    if (!record) throw new NotFoundException(`City not found: ${id}`);
    return { city: this.toPublicCityDetail(record, locale), locale };
  }

  async getExcursionById(
    id: string,
    locale: Locale,
  ): Promise<PublicExcursionResponse> {
    for (const city of CITY_RECORDS) {
      const excursion = city.excursions?.find((e) => e.slug === id);
      if (excursion) {
        return { excursion: this.toPublicExcursion(excursion, locale), locale };
      }
    }
    throw new NotFoundException(`Excursion not found: ${id}`);
  }

  async getPlaceById(id: string, locale: Locale): Promise<PublicPlaceResponse> {
    for (const city of CITY_RECORDS) {
      const restaurant = city.restaurants?.find((p) => p.slug === id);
      if (restaurant)
        return {
          place: this.toPublicPlace(restaurant, 'restaurant', locale),
          locale,
        };
      const bar = city.bars?.find((p) => p.slug === id);
      if (bar)
        return {
          place: this.toPublicPlace(bar, 'bar', locale),
          locale,
        };
      const shop = city.shopping?.find((p) => p.slug === id);
      if (shop)
        return {
          place: this.toPublicPlace(shop, 'shopping', locale),
          locale,
        };
    }
    throw new NotFoundException(`Place not found: ${id}`);
  }

  private toPublicCity(record: CityRecord, locale: Locale): PublicCity {
    return {
      id: record.slug,
      image: record.image,
      name: pickLocalized(record.name, locale),
      country: pickLocalized(record.country, locale),
      editorPick: this.resolveEditorPick(record.editorPick, locale),
    };
  }

  private toPublicCityDetail(
    record: CityRecord,
    locale: Locale,
  ): PublicCityDetail {
    return {
      ...this.toPublicCity(record, locale),
      excursions: record.excursions?.map((e) =>
        this.toCategoryItemFromExcursion(e, locale),
      ),
      restaurants: record.restaurants?.map((p) =>
        this.toPublicCategoryItem(p, locale),
      ),
      bars: record.bars?.map((p) => this.toPublicCategoryItem(p, locale)),
      shopping: record.shopping?.map((p) =>
        this.toPublicCategoryItem(p, locale),
      ),
    };
  }

  private resolveEditorPick(
    pick: CityRecord['editorPick'],
    locale: Locale,
  ): PublicEditorPick | undefined {
    if (!pick) return undefined;
    return {
      headline: pickLocalized(pick.headline, locale),
      tagline: pickLocalized(pick.tagline, locale),
    };
  }

  private toPublicCategoryItem(
    record: CategoryItemRecord,
    locale: Locale,
  ): PublicCategoryItem {
    return {
      id: record.slug,
      name: pickLocalized(record.name, locale),
      meta: pickLocalized(record.meta, locale),
      image: record.image,
      description: record.description
        ? pickLocalized(record.description, locale)
        : undefined,
      images: record.images,
    };
  }

  // The excursion summary in a city detail uses CategoryItem shape (id, name,
  // meta, image) — we omit stops/pois at the list level.
  private toCategoryItemFromExcursion(
    record: ExcursionRecord,
    locale: Locale,
  ): PublicCategoryItem {
    return {
      id: record.slug,
      name: pickLocalized(record.name, locale),
      meta: pickLocalized(record.meta, locale),
      image: record.image,
    };
  }

  private toPublicExcursion(
    record: ExcursionRecord,
    locale: Locale,
  ): PublicExcursion {
    return {
      id: record.slug,
      name: pickLocalized(record.name, locale),
      meta: pickLocalized(record.meta, locale),
      image: record.image,
      stops: record.stops.map((stop) => this.toPublicStop(stop, locale)),
      pois: record.pois?.map((poi) => this.toPublicPoi(poi, locale)),
    };
  }

  private toPublicStop(
    record: ExcursionStopRecord,
    locale: Locale,
  ): PublicExcursionStop {
    return {
      id: record.slug,
      order: record.order,
      name: pickLocalized(record.name, locale),
      description: pickLocalized(record.description, locale),
      coords: record.coords,
      image: record.image,
      images: record.images,
      audioUrl: record.audioUrl,
    };
  }

  private toPublicPoi(record: PoiRecord, locale: Locale): PublicPoi {
    return {
      id: record.slug,
      order: record.order,
      name: pickLocalized(record.name, locale),
      category: record.category,
      description: pickLocalized(record.description, locale),
      coords: record.coords,
      image: record.image,
      images: record.images,
    };
  }

  private toPublicPlace(
    record: CategoryItemRecord,
    category: PoiCategory,
    locale: Locale,
  ): PublicPlaceDetail {
    return {
      id: record.slug,
      name: pickLocalized(record.name, locale),
      meta: pickLocalized(record.meta, locale),
      category,
      image: record.image,
      description: record.description
        ? pickLocalized(record.description, locale)
        : undefined,
      images: record.images,
    };
  }
}
