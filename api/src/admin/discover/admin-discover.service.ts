import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminCity,
  AdminExcursion,
  AdminInactiveRef,
  AdminPlace,
  AdminStats,
  AdminStatsTimeseriesPoint,
  PoiCategory,
} from '@guide-me-app/core';
import { PLACE_CATEGORIES } from '../../discover/schemas/discover-place.schema';
import { CacheService } from '../../cache/cache.service';
import { DISCOVER_CACHE_PREFIX } from '../../discover/discover.interceptor';
import { DiscoverRepository } from '../../discover/discover.repository';
import { DiscoverCityDocument } from '../../discover/schemas/discover-city.schema';
import { DiscoverExcursionDocument } from '../../discover/schemas/discover-excursion.schema';
import { DiscoverPlaceDocument } from '../../discover/schemas/discover-place.schema';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { CreateExcursionDto, UpdateExcursionDto } from './dto/excursion.dto';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';

@Injectable()
export class AdminDiscoverService {
  constructor(
    private readonly repo: DiscoverRepository,
    private readonly cache: CacheService,
  ) {}

  // ---------------- Cities ----------------

  async listCities(): Promise<AdminCity[]> {
    const docs = await this.repo.findAllCitiesAdmin();
    return docs.map((d) => this.toAdminCity(d));
  }

  async getCity(slug: string): Promise<AdminCity> {
    const doc = await this.repo.findCityBySlugAdmin(slug);
    if (!doc) throw new NotFoundException(`City not found: ${slug}`);
    return this.toAdminCity(doc);
  }

  async createCity(dto: CreateCityDto): Promise<AdminCity> {
    const existing = await this.repo.findCityBySlugAdmin(dto.slug);
    if (existing)
      throw new ConflictException(`City slug already exists: ${dto.slug}`);
    await this.assertCityPlaceSlugsValid(dto.cityPlaceSlugs ?? [], dto.slug);
    const doc = await this.repo.insertCity({
      ...dto,
      cityPlaceSlugs: dto.cityPlaceSlugs ?? [],
      isEnabled: dto.isEnabled ?? true,
    });
    await this.bustCache();
    return this.toAdminCity(doc);
  }

  async updateCity(slug: string, dto: UpdateCityDto): Promise<AdminCity> {
    if (dto.cityPlaceSlugs !== undefined) {
      await this.assertCityPlaceSlugsValid(dto.cityPlaceSlugs, slug);
    }
    const doc = await this.repo.updateCityBySlug(slug, { $set: dto });
    if (!doc) throw new NotFoundException(`City not found: ${slug}`);
    await this.bustCache();
    return this.toAdminCity(doc);
  }

  async deleteCity(slug: string): Promise<void> {
    const [excursionCount, placeCount] = await Promise.all([
      this.repo.countExcursionsForCity(slug),
      this.repo.countPlacesForCity(slug),
    ]);
    if (excursionCount > 0 || placeCount > 0) {
      throw new ConflictException(
        `City ${slug} has ${excursionCount} excursion(s) and ${placeCount} place(s). Delete those first.`,
      );
    }
    const result = await this.repo.deleteCityBySlug(slug);
    if (result.deletedCount === 0)
      throw new NotFoundException(`City not found: ${slug}`);
    await this.bustCache();
  }

  // ---------------- Excursions ----------------

  async listExcursions(citySlug?: string): Promise<AdminExcursion[]> {
    const filter = citySlug ? { citySlug } : {};
    const docs = await this.repo.findAllExcursionsAdmin(filter);
    return docs.map((d) => this.toAdminExcursion(d));
  }

  async getExcursion(slug: string): Promise<AdminExcursion> {
    const doc = await this.repo.findExcursionBySlugAdmin(slug);
    if (!doc) throw new NotFoundException(`Excursion not found: ${slug}`);
    return this.toAdminExcursion(doc);
  }

  async createExcursion(dto: CreateExcursionDto): Promise<AdminExcursion> {
    const city = await this.repo.findCityBySlugAdmin(dto.citySlug);
    if (!city)
      throw new NotFoundException(`Parent city not found: ${dto.citySlug}`);
    const existing = await this.repo.findExcursionBySlugAdmin(dto.slug);
    if (existing)
      throw new ConflictException(`Excursion slug already exists: ${dto.slug}`);
    await this.assertPoiRefsExist(dto.pois ?? [], dto.citySlug);
    const doc = await this.repo.insertExcursion({
      ...dto,
      stops: dto.stops ?? [],
      pois: dto.pois ?? [],
      interestingFacts: dto.interestingFacts ?? [],
      isEnabled: dto.isEnabled ?? true,
    });
    await this.bustCache();
    return this.toAdminExcursion(doc);
  }

  async updateExcursion(
    slug: string,
    dto: UpdateExcursionDto,
  ): Promise<AdminExcursion> {
    if (dto.citySlug) {
      const city = await this.repo.findCityBySlugAdmin(dto.citySlug);
      if (!city)
        throw new NotFoundException(`Parent city not found: ${dto.citySlug}`);
    }
    if (dto.pois !== undefined) {
      // If citySlug isn't being changed, validate against the existing
      // excursion's citySlug so a stray ref to a foreign city is rejected.
      let citySlug = dto.citySlug;
      if (!citySlug) {
        const current = await this.repo.findExcursionBySlugAdmin(slug);
        if (!current)
          throw new NotFoundException(`Excursion not found: ${slug}`);
        citySlug = current.citySlug;
      }
      await this.assertPoiRefsExist(dto.pois, citySlug);
    }
    const doc = await this.repo.updateExcursionBySlug(slug, { $set: dto });
    if (!doc) throw new NotFoundException(`Excursion not found: ${slug}`);
    await this.bustCache();
    return this.toAdminExcursion(doc);
  }

  async deleteExcursion(slug: string): Promise<void> {
    const result = await this.repo.deleteExcursionBySlug(slug);
    if (result.deletedCount === 0)
      throw new NotFoundException(`Excursion not found: ${slug}`);
    await this.bustCache();
  }

  // ---------------- Places ----------------

  async listPlaces(
    citySlug?: string,
    category?: PoiCategory,
  ): Promise<AdminPlace[]> {
    const filter: Record<string, unknown> = {};
    if (citySlug) filter.citySlug = citySlug;
    if (category) filter.category = category;
    const docs = await this.repo.findAllPlacesAdmin(filter);
    return docs.map((d) => this.toAdminPlace(d));
  }

  async getPlace(slug: string): Promise<AdminPlace> {
    const doc = await this.repo.findPlaceBySlugAdmin(slug);
    if (!doc) throw new NotFoundException(`Place not found: ${slug}`);
    return this.toAdminPlace(doc);
  }

  async createPlace(dto: CreatePlaceDto): Promise<AdminPlace> {
    const city = await this.repo.findCityBySlugAdmin(dto.citySlug);
    if (!city)
      throw new NotFoundException(`Parent city not found: ${dto.citySlug}`);
    const existing = await this.repo.findPlaceBySlugAdmin(dto.slug);
    if (existing)
      throw new ConflictException(`Place slug already exists: ${dto.slug}`);
    const doc = await this.repo.insertPlace({
      ...dto,
      isEnabled: dto.isEnabled ?? true,
    });
    await this.bustCache();
    return this.toAdminPlace(doc);
  }

  async updatePlace(slug: string, dto: UpdatePlaceDto): Promise<AdminPlace> {
    if (dto.citySlug) {
      const city = await this.repo.findCityBySlugAdmin(dto.citySlug);
      if (!city)
        throw new NotFoundException(`Parent city not found: ${dto.citySlug}`);
    }
    const doc = await this.repo.updatePlaceBySlug(slug, { $set: dto });
    if (!doc) throw new NotFoundException(`Place not found: ${slug}`);
    await this.bustCache();
    return this.toAdminPlace(doc);
  }

  async deletePlace(slug: string): Promise<void> {
    const [cityRefs, excursionRefs] = await Promise.all([
      this.repo.countCitiesReferencingPlace(slug),
      this.repo.countExcursionsReferencingPlace(slug),
    ]);
    if (cityRefs > 0 || excursionRefs > 0) {
      throw new ConflictException(
        `Place ${slug} is referenced by ${cityRefs} city/cities and ${excursionRefs} excursion(s). Remove references first.`,
      );
    }
    const result = await this.repo.deletePlaceBySlug(slug);
    if (result.deletedCount === 0)
      throw new NotFoundException(`Place not found: ${slug}`);
    await this.bustCache();
  }

  // ---------------- Stats ----------------

  async getStats(): Promise<AdminStats> {
    // Fetch all three collections in parallel. The dataset is small (admin
    // working set, typically < 1000 docs total) so a full scan is fine — no
    // need for aggregation pipelines.
    const [cities, excursions, places] = await Promise.all([
      this.repo.findAllCitiesAdmin(),
      this.repo.findAllExcursionsAdmin(),
      this.repo.findAllPlacesAdmin(),
    ]);

    const placesByCategory: Record<PoiCategory, number> = Object.fromEntries(
      PLACE_CATEGORIES.map((c) => [c, 0]),
    ) as Record<PoiCategory, number>;
    for (const p of places) {
      placesByCategory[p.category as PoiCategory] =
        (placesByCategory[p.category as PoiCategory] ?? 0) + 1;
    }

    const excursionStops = excursions.reduce(
      (sum, e) => sum + (e.stops?.length ?? 0),
      0,
    );
    const interestingFacts = excursions.reduce(
      (sum, e) => sum + (e.interestingFacts?.length ?? 0),
      0,
    );
    const poiReferences = excursions.reduce(
      (sum, e) => sum + (e.pois?.length ?? 0),
      0,
    );

    const inactive = {
      cities: cities
        .filter((c) => !c.isEnabled)
        .map(
          (c): AdminInactiveRef => ({ slug: c.slug, name: c.name?.en ?? c.slug }),
        ),
      excursions: excursions
        .filter((e) => !e.isEnabled)
        .map(
          (e): AdminInactiveRef => ({
            slug: e.slug,
            name: e.name?.en ?? e.slug,
            citySlug: e.citySlug,
          }),
        ),
      places: places
        .filter((p) => !p.isEnabled)
        .map(
          (p): AdminInactiveRef => ({
            slug: p.slug,
            name: p.name?.en ?? p.slug,
            citySlug: p.citySlug,
          }),
        ),
    };

    const timeseries = buildCumulativeTimeseries({
      cities: cities.map(extractCreatedAt),
      excursions: excursions.map(extractCreatedAt),
      places: places.map(extractCreatedAt),
    });

    return {
      counts: {
        cities: cities.length,
        excursions: excursions.length,
        places: places.length,
        placesByCategory,
        excursionStops,
        interestingFacts,
        poiReferences,
      },
      inactive,
      timeseries,
    };
  }

  // ---------------- Helpers ----------------

  // Wipes all discover cache entries on every write. Cheap (a few hundred
  // entries max) and avoids stale reads on the mobile app immediately.
  private async bustCache(): Promise<void> {
    await this.cache.resetByPrefix(DISCOVER_CACHE_PREFIX);
  }

  // Validates that every slug in `cityPlaceSlugs` resolves to a place
  // *belonging to that city*. Cross-city listings are rejected — keeps the
  // city detail screen honest. Uses findAllPlacesAdmin so disabled places
  // are still considered valid references (editor may toggle later).
  private async assertCityPlaceSlugsValid(
    slugs: string[],
    citySlug: string,
  ): Promise<void> {
    if (slugs.length === 0) return;
    const found = await this.repo.findAllPlacesAdmin({
      slug: { $in: slugs },
    });
    const bySlug = new Map(found.map((p) => [p.slug, p] as const));
    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Unknown place slug(s) in cityPlaceSlugs: ${missing.join(', ')}`,
      );
    }
    const foreign = slugs.filter((s) => bySlug.get(s)!.citySlug !== citySlug);
    if (foreign.length > 0) {
      throw new ConflictException(
        `Place(s) belong to another city: ${foreign.join(', ')}`,
      );
    }
  }

  // Validates excursion POI references against the places collection. Same
  // city check as cityPlaceSlugs — an excursion can only point at places in
  // its own city.
  private async assertPoiRefsExist(
    refs: ReadonlyArray<{ placeSlug: string }>,
    citySlug: string,
  ): Promise<void> {
    if (refs.length === 0) return;
    const slugs = refs.map((r) => r.placeSlug);
    const found = await this.repo.findAllPlacesAdmin({
      slug: { $in: slugs },
    });
    const bySlug = new Map(found.map((p) => [p.slug, p] as const));
    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Unknown place slug(s) in pois: ${missing.join(', ')}`,
      );
    }
    const foreign = slugs.filter((s) => bySlug.get(s)!.citySlug !== citySlug);
    if (foreign.length > 0) {
      throw new ConflictException(
        `POI place(s) belong to another city: ${foreign.join(', ')}`,
      );
    }
  }

  private toAdminCity(doc: DiscoverCityDocument): AdminCity {
    return {
      slug: doc.slug,
      image: doc.image,
      name: doc.name,
      country: doc.country,
      editorPick: doc.editorPick,
      audioUrl: doc.audioUrl,
      cityPlaceSlugs: doc.cityPlaceSlugs ?? [],
      isEnabled: doc.isEnabled,
      createdAt: (doc as any).createdAt?.toISOString?.(),
      updatedAt: (doc as any).updatedAt?.toISOString?.(),
    };
  }

  private toAdminExcursion(doc: DiscoverExcursionDocument): AdminExcursion {
    return {
      slug: doc.slug,
      citySlug: doc.citySlug,
      name: doc.name,
      meta: doc.meta,
      image: doc.image,
      stops: doc.stops as AdminExcursion['stops'],
      pois: (doc.pois ?? []) as AdminExcursion['pois'],
      interestingFacts: (doc.interestingFacts ??
        []) as AdminExcursion['interestingFacts'],
      isEnabled: doc.isEnabled,
      createdAt: (doc as any).createdAt?.toISOString?.(),
      updatedAt: (doc as any).updatedAt?.toISOString?.(),
    };
  }

  private toAdminPlace(doc: DiscoverPlaceDocument): AdminPlace {
    return {
      slug: doc.slug,
      citySlug: doc.citySlug,
      category: doc.category,
      name: doc.name,
      meta: doc.meta,
      image: doc.image,
      description: doc.description,
      images: doc.images,
      coords: doc.coords,
      subCategory: doc.subCategory,
      audioUrl: doc.audioUrl,
      isEnabled: doc.isEnabled,
      createdAt: (doc as any).createdAt?.toISOString?.(),
      updatedAt: (doc as any).updatedAt?.toISOString?.(),
    };
  }
}

// Pulls the Mongoose-managed createdAt timestamp from a lean document. The
// schema declares timestamps: true so this is always present in practice; we
// fall back to `null` defensively so old or imported docs don't crash the
// timeseries.
function extractCreatedAt(doc: unknown): Date | null {
  const raw = (doc as { createdAt?: unknown } | null)?.createdAt;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

// Builds a sparse cumulative timeseries: one point per UTC day on which at
// least one entity (city, excursion, or place) was created. Each point holds
// the running totals up to and including that day. Sparse, not daily, so
// the response stays small even across long gaps.
function buildCumulativeTimeseries(grouped: {
  cities: Array<Date | null>;
  excursions: Array<Date | null>;
  places: Array<Date | null>;
}): AdminStatsTimeseriesPoint[] {
  type Tally = { cities: number; excursions: number; places: number };
  const perDay = new Map<string, Tally>();

  const bump = (date: Date | null, key: keyof Tally): void => {
    if (!date) return;
    const day = date.toISOString().slice(0, 10);
    const cur = perDay.get(day) ?? { cities: 0, excursions: 0, places: 0 };
    cur[key]++;
    perDay.set(day, cur);
  };

  for (const d of grouped.cities) bump(d, 'cities');
  for (const d of grouped.excursions) bump(d, 'excursions');
  for (const d of grouped.places) bump(d, 'places');

  const sortedDays = [...perDay.keys()].sort();
  let cumC = 0;
  let cumE = 0;
  let cumP = 0;
  return sortedDays.map((day) => {
    const t = perDay.get(day)!;
    cumC += t.cities;
    cumE += t.excursions;
    cumP += t.places;
    return { date: day, cities: cumC, excursions: cumE, places: cumP };
  });
}
