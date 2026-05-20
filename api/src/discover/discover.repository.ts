import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoiCategory } from '@guide-me-app/core';
import {
  DiscoverCity,
  DiscoverCityDocument,
} from './schemas/discover-city.schema';
import {
  DiscoverExcursion,
  DiscoverExcursionDocument,
} from './schemas/discover-excursion.schema';
import {
  DiscoverPlace,
  DiscoverPlaceDocument,
} from './schemas/discover-place.schema';

// Lightweight projection of an excursion for the city detail screen: we
// don't ship stops/POIs in the city detail response — they come on demand
// via the excursion detail endpoint.
export type ExcursionSummary = Pick<
  DiscoverExcursionDocument,
  'slug' | 'name' | 'meta' | 'image'
>;

@Injectable()
export class DiscoverRepository {
  constructor(
    @InjectModel(DiscoverCity.name)
    private readonly cityModel: Model<DiscoverCity>,
    @InjectModel(DiscoverExcursion.name)
    private readonly excursionModel: Model<DiscoverExcursion>,
    @InjectModel(DiscoverPlace.name)
    private readonly placeModel: Model<DiscoverPlace>,
  ) {}

  // --- Reads ---

  findAllCities(): Promise<DiscoverCityDocument[]> {
    return this.cityModel.find({}).lean<DiscoverCityDocument[]>().exec();
  }

  findCityBySlug(slug: string): Promise<DiscoverCityDocument | null> {
    return this.cityModel
      .findOne({ slug })
      .lean<DiscoverCityDocument>()
      .exec();
  }

  findExcursionSummariesForCity(citySlug: string): Promise<ExcursionSummary[]> {
    return this.excursionModel
      .find({ citySlug })
      .select({ slug: 1, name: 1, meta: 1, image: 1 })
      .lean<ExcursionSummary[]>()
      .exec();
  }

  findPlacesForCity(
    citySlug: string,
    category: PoiCategory,
  ): Promise<DiscoverPlaceDocument[]> {
    return this.placeModel
      .find({ citySlug, category })
      .lean<DiscoverPlaceDocument[]>()
      .exec();
  }

  findExcursionBySlug(
    slug: string,
  ): Promise<DiscoverExcursionDocument | null> {
    return this.excursionModel
      .findOne({ slug })
      .lean<DiscoverExcursionDocument>()
      .exec();
  }

  findPlaceBySlug(slug: string): Promise<DiscoverPlaceDocument | null> {
    return this.placeModel
      .findOne({ slug })
      .lean<DiscoverPlaceDocument>()
      .exec();
  }

  // --- Writes (used by the seed script) ---

  async wipeAll(): Promise<void> {
    await Promise.all([
      this.cityModel.deleteMany({}).exec(),
      this.excursionModel.deleteMany({}).exec(),
      this.placeModel.deleteMany({}).exec(),
    ]);
  }

  insertCity(input: Partial<DiscoverCity>): Promise<DiscoverCityDocument> {
    return this.cityModel.create(input) as unknown as Promise<DiscoverCityDocument>;
  }

  insertExcursion(
    input: Partial<DiscoverExcursion>,
  ): Promise<DiscoverExcursionDocument> {
    return this.excursionModel.create(
      input,
    ) as unknown as Promise<DiscoverExcursionDocument>;
  }

  insertPlace(
    input: Partial<DiscoverPlace>,
  ): Promise<DiscoverPlaceDocument> {
    return this.placeModel.create(
      input,
    ) as unknown as Promise<DiscoverPlaceDocument>;
  }
}
