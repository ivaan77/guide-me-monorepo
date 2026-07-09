import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type FilterQuery, type UpdateQuery } from 'mongoose';
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
// via the excursion detail endpoint. Rating aggregate is included so the
// list card can show "★ 4.3 · 27" alongside the excursion.
export type ExcursionSummary = Pick<
  DiscoverExcursionDocument,
  'slug' | 'name' | 'meta' | 'image' | 'ratingSum' | 'ratingCount'
>;

const ENABLED_FILTER = { isEnabled: true };

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

  // --- Public reads (filter by isEnabled) ---

  findAllEnabledCities(): Promise<DiscoverCityDocument[]> {
    return this.cityModel
      .find(ENABLED_FILTER)
      .lean<DiscoverCityDocument[]>()
      .exec();
  }

  findEnabledCityBySlug(slug: string): Promise<DiscoverCityDocument | null> {
    return this.cityModel
      .findOne({ slug, ...ENABLED_FILTER })
      .lean<DiscoverCityDocument>()
      .exec();
  }

  findEnabledExcursionSummariesForCity(
    citySlug: string,
  ): Promise<ExcursionSummary[]> {
    return this.excursionModel
      .find({ citySlug, ...ENABLED_FILTER })
      .select({
        slug: 1,
        name: 1,
        meta: 1,
        image: 1,
        ratingSum: 1,
        ratingCount: 1,
      })
      .lean<ExcursionSummary[]>()
      .exec();
  }

  findEnabledPlacesForCity(
    citySlug: string,
    category: PoiCategory,
  ): Promise<DiscoverPlaceDocument[]> {
    return this.placeModel
      .find({ citySlug, category, ...ENABLED_FILTER })
      .lean<DiscoverPlaceDocument[]>()
      .exec();
  }

  // Resolves a list of place slugs to documents. Used by the city detail
  // endpoint (city.cityPlaceSlugs) and the excursion detail endpoint
  // (excursion.pois[].placeSlug). Filters out disabled places so a deleted/
  // hidden place silently drops out of the response.
  findEnabledPlacesBySlugs(slugs: string[]): Promise<DiscoverPlaceDocument[]> {
    if (slugs.length === 0) return Promise.resolve([]);
    return this.placeModel
      .find({ slug: { $in: slugs }, ...ENABLED_FILTER })
      .lean<DiscoverPlaceDocument[]>()
      .exec();
  }

  // Bulk slug lookups used to hydrate user favorites. Anything missing
  // from the result (disabled or deleted) is silently dropped at the
  // call site.
  findEnabledCitiesBySlugs(slugs: string[]): Promise<DiscoverCityDocument[]> {
    if (slugs.length === 0) return Promise.resolve([]);
    return this.cityModel
      .find({ slug: { $in: slugs }, ...ENABLED_FILTER })
      .lean<DiscoverCityDocument[]>()
      .exec();
  }

  findEnabledExcursionsBySlugs(
    slugs: string[],
  ): Promise<DiscoverExcursionDocument[]> {
    if (slugs.length === 0) return Promise.resolve([]);
    return this.excursionModel
      .find({ slug: { $in: slugs }, ...ENABLED_FILTER })
      .lean<DiscoverExcursionDocument[]>()
      .exec();
  }

  findEnabledExcursionBySlug(
    slug: string,
  ): Promise<DiscoverExcursionDocument | null> {
    return this.excursionModel
      .findOne({ slug, ...ENABLED_FILTER })
      .lean<DiscoverExcursionDocument>()
      .exec();
  }

  findEnabledPlaceBySlug(slug: string): Promise<DiscoverPlaceDocument | null> {
    return this.placeModel
      .findOne({ slug, ...ENABLED_FILTER })
      .lean<DiscoverPlaceDocument>()
      .exec();
  }

  // Aggregate reads used by public stats + gallery — full enabled scans.
  // The dataset is small (see admin getStats comment) so full scans are fine.

  findAllEnabledExcursions(): Promise<DiscoverExcursionDocument[]> {
    return this.excursionModel
      .find(ENABLED_FILTER)
      .lean<DiscoverExcursionDocument[]>()
      .exec();
  }

  findAllEnabledPlaces(): Promise<DiscoverPlaceDocument[]> {
    return this.placeModel
      .find(ENABLED_FILTER)
      .lean<DiscoverPlaceDocument[]>()
      .exec();
  }

  // --- Web gallery (admin curated, public consumer) ---

  // All enabled cities admin has marked webFeatured, sorted by their editor-
  // set order. Enabled filter is intentional — hidden cities never leak to
  // the public gallery even if the flag is still set.
  findWebFeaturedCities(): Promise<DiscoverCityDocument[]> {
    return this.cityModel
      .find({ ...ENABLED_FILTER, webFeatured: true })
      .sort({ webFeaturedOrder: 1, slug: 1 })
      .lean<DiscoverCityDocument[]>()
      .exec();
  }

  findWebFeaturedPlaces(): Promise<DiscoverPlaceDocument[]> {
    return this.placeModel
      .find({ ...ENABLED_FILTER, webFeatured: true })
      .sort({ webFeaturedOrder: 1, slug: 1 })
      .lean<DiscoverPlaceDocument[]>()
      .exec();
  }

  // --- Admin reads (no isEnabled filter) ---

  findAllCitiesAdmin(): Promise<DiscoverCityDocument[]> {
    return this.cityModel.find({}).lean<DiscoverCityDocument[]>().exec();
  }

  findCityBySlugAdmin(slug: string): Promise<DiscoverCityDocument | null> {
    return this.cityModel.findOne({ slug }).lean<DiscoverCityDocument>().exec();
  }

  findAllExcursionsAdmin(
    filter: FilterQuery<DiscoverExcursion> = {},
  ): Promise<DiscoverExcursionDocument[]> {
    return this.excursionModel
      .find(filter)
      .lean<DiscoverExcursionDocument[]>()
      .exec();
  }

  findExcursionBySlugAdmin(
    slug: string,
  ): Promise<DiscoverExcursionDocument | null> {
    return this.excursionModel
      .findOne({ slug })
      .lean<DiscoverExcursionDocument>()
      .exec();
  }

  findAllPlacesAdmin(
    filter: FilterQuery<DiscoverPlace> = {},
  ): Promise<DiscoverPlaceDocument[]> {
    return this.placeModel.find(filter).lean<DiscoverPlaceDocument[]>().exec();
  }

  findPlaceBySlugAdmin(slug: string): Promise<DiscoverPlaceDocument | null> {
    return this.placeModel
      .findOne({ slug })
      .lean<DiscoverPlaceDocument>()
      .exec();
  }

  // --- Counts (used by delete-blocking) ---

  countExcursionsForCity(citySlug: string): Promise<number> {
    return this.excursionModel.countDocuments({ citySlug }).exec();
  }

  countPlacesForCity(citySlug: string): Promise<number> {
    return this.placeModel.countDocuments({ citySlug }).exec();
  }

  // Cities can list a place in cityPlaceSlugs. Used to block deletion of a
  // place that's still wired into a city's display list.
  countCitiesReferencingPlace(placeSlug: string): Promise<number> {
    return this.cityModel.countDocuments({ cityPlaceSlugs: placeSlug }).exec();
  }

  // Excursions reference a place via pois[].placeSlug.
  countExcursionsReferencingPlace(placeSlug: string): Promise<number> {
    return this.excursionModel
      .countDocuments({ 'pois.placeSlug': placeSlug })
      .exec();
  }

  // --- Admin web-content writes (bulk gallery update) ---

  // Sets webFeatured + webFeaturedOrder on a single doc by slug. Returns true
  // if the doc existed. Callers should collect these across a batch and
  // report which slugs weren't found.
  async setCityWebFeatured(
    slug: string,
    webFeatured: boolean,
    webFeaturedOrder: number,
  ): Promise<boolean> {
    const r = await this.cityModel
      .updateOne({ slug }, { $set: { webFeatured, webFeaturedOrder } })
      .exec();
    return (r.matchedCount ?? 0) > 0;
  }

  async setPlaceWebFeatured(
    slug: string,
    webFeatured: boolean,
    webFeaturedOrder: number,
  ): Promise<boolean> {
    const r = await this.placeModel
      .updateOne({ slug }, { $set: { webFeatured, webFeaturedOrder } })
      .exec();
    return (r.matchedCount ?? 0) > 0;
  }

  // --- Writes ---

  insertCity(input: Partial<DiscoverCity>): Promise<DiscoverCityDocument> {
    return this.cityModel.create(
      input,
    ) as unknown as Promise<DiscoverCityDocument>;
  }

  insertExcursion(
    input: Partial<DiscoverExcursion>,
  ): Promise<DiscoverExcursionDocument> {
    return this.excursionModel.create(
      input,
    ) as unknown as Promise<DiscoverExcursionDocument>;
  }

  insertPlace(input: Partial<DiscoverPlace>): Promise<DiscoverPlaceDocument> {
    return this.placeModel.create(
      input,
    ) as unknown as Promise<DiscoverPlaceDocument>;
  }

  updateCityBySlug(
    slug: string,
    update: UpdateQuery<DiscoverCity>,
  ): Promise<DiscoverCityDocument | null> {
    return this.cityModel
      .findOneAndUpdate({ slug }, update, { new: true })
      .lean<DiscoverCityDocument>()
      .exec();
  }

  updateExcursionBySlug(
    slug: string,
    update: UpdateQuery<DiscoverExcursion>,
  ): Promise<DiscoverExcursionDocument | null> {
    return this.excursionModel
      .findOneAndUpdate({ slug }, update, { new: true })
      .lean<DiscoverExcursionDocument>()
      .exec();
  }

  updatePlaceBySlug(
    slug: string,
    update: UpdateQuery<DiscoverPlace>,
  ): Promise<DiscoverPlaceDocument | null> {
    return this.placeModel
      .findOneAndUpdate({ slug }, update, { new: true })
      .lean<DiscoverPlaceDocument>()
      .exec();
  }

  deleteCityBySlug(slug: string): Promise<{ deletedCount: number }> {
    return this.cityModel
      .deleteOne({ slug })
      .exec()
      .then((r) => ({ deletedCount: r.deletedCount ?? 0 }));
  }

  deleteExcursionBySlug(slug: string): Promise<{ deletedCount: number }> {
    return this.excursionModel
      .deleteOne({ slug })
      .exec()
      .then((r) => ({ deletedCount: r.deletedCount ?? 0 }));
  }

  deletePlaceBySlug(slug: string): Promise<{ deletedCount: number }> {
    return this.placeModel
      .deleteOne({ slug })
      .exec()
      .then((r) => ({ deletedCount: r.deletedCount ?? 0 }));
  }
}
