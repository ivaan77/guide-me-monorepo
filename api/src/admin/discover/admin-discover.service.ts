import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminCity,
  AdminExcursion,
  AdminPlace,
  PoiCategory,
} from '@guide-me-app/core';
import { CacheService } from '../../cache/cache.service';
import { DISCOVER_CACHE_PREFIX } from '../../discover/discover.interceptor';
import { DiscoverRepository } from '../../discover/discover.repository';
import {
  DiscoverCityDocument,
} from '../../discover/schemas/discover-city.schema';
import {
  DiscoverExcursionDocument,
} from '../../discover/schemas/discover-excursion.schema';
import {
  DiscoverPlaceDocument,
} from '../../discover/schemas/discover-place.schema';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import {
  CreateExcursionDto,
  UpdateExcursionDto,
} from './dto/excursion.dto';
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
    const doc = await this.repo.insertCity({
      ...dto,
      isEnabled: dto.isEnabled ?? true,
    });
    await this.bustCache();
    return this.toAdminCity(doc);
  }

  async updateCity(slug: string, dto: UpdateCityDto): Promise<AdminCity> {
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
    const doc = await this.repo.insertExcursion({
      ...dto,
      stops: dto.stops ?? [],
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
    const result = await this.repo.deletePlaceBySlug(slug);
    if (result.deletedCount === 0)
      throw new NotFoundException(`Place not found: ${slug}`);
    await this.bustCache();
  }

  // ---------------- Helpers ----------------

  // Wipes all discover cache entries on every write. Cheap (a few hundred
  // entries max) and avoids stale reads on the mobile app immediately.
  private async bustCache(): Promise<void> {
    await this.cache.resetByPrefix(DISCOVER_CACHE_PREFIX);
  }

  private toAdminCity(doc: DiscoverCityDocument): AdminCity {
    return {
      slug: doc.slug,
      image: doc.image,
      name: doc.name,
      country: doc.country,
      editorPick: doc.editorPick,
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
      pois: doc.pois as AdminExcursion['pois'],
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
      isEnabled: doc.isEnabled,
      createdAt: (doc as any).createdAt?.toISOString?.(),
      updatedAt: (doc as any).updatedAt?.toISOString?.(),
    };
  }
}
