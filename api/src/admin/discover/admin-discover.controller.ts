import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminAllCitiesResponse,
  AdminAllExcursionsResponse,
  AdminAllPlacesResponse,
  AdminCityResponse,
  AdminExcursionResponse,
  AdminPath,
  AdminPlaceResponse,
  AdminStatsResponse,
  PoiCategory,
} from '@guide-me-app/core';
import { AdminTokenGuard } from '../admin-token.guard';
import { AdminDiscoverService } from './admin-discover.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';
import { CreateExcursionDto, UpdateExcursionDto } from './dto/excursion.dto';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';

// All endpoints below are gated by the shared-secret AdminTokenGuard.
// Replace with real auth (JWT or session) when login lands.
@Controller()
@UseGuards(AdminTokenGuard)
export class AdminDiscoverController {
  constructor(private readonly service: AdminDiscoverService) {}

  // ---------- Cities ----------

  @Get(AdminPath.Discover.cities)
  async listCities(): Promise<AdminAllCitiesResponse> {
    return { cities: await this.service.listCities() };
  }

  @Get(AdminPath.Discover.cityBySlug)
  async getCity(@Param('slug') slug: string): Promise<AdminCityResponse> {
    return { city: await this.service.getCity(slug) };
  }

  @Post(AdminPath.Discover.cities)
  async createCity(@Body() dto: CreateCityDto): Promise<AdminCityResponse> {
    return { city: await this.service.createCity(dto) };
  }

  @Patch(AdminPath.Discover.cityBySlug)
  async updateCity(
    @Param('slug') slug: string,
    @Body() dto: UpdateCityDto,
  ): Promise<AdminCityResponse> {
    return { city: await this.service.updateCity(slug, dto) };
  }

  @Delete(AdminPath.Discover.cityBySlug)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCity(@Param('slug') slug: string): Promise<void> {
    await this.service.deleteCity(slug);
  }

  // ---------- Excursions ----------

  @Get(AdminPath.Discover.excursions)
  async listExcursions(
    @Query('citySlug') citySlug?: string,
  ): Promise<AdminAllExcursionsResponse> {
    return { excursions: await this.service.listExcursions(citySlug) };
  }

  @Get(AdminPath.Discover.excursionBySlug)
  async getExcursion(
    @Param('slug') slug: string,
  ): Promise<AdminExcursionResponse> {
    return { excursion: await this.service.getExcursion(slug) };
  }

  @Post(AdminPath.Discover.excursions)
  async createExcursion(
    @Body() dto: CreateExcursionDto,
  ): Promise<AdminExcursionResponse> {
    return { excursion: await this.service.createExcursion(dto) };
  }

  @Patch(AdminPath.Discover.excursionBySlug)
  async updateExcursion(
    @Param('slug') slug: string,
    @Body() dto: UpdateExcursionDto,
  ): Promise<AdminExcursionResponse> {
    return { excursion: await this.service.updateExcursion(slug, dto) };
  }

  @Delete(AdminPath.Discover.excursionBySlug)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExcursion(@Param('slug') slug: string): Promise<void> {
    await this.service.deleteExcursion(slug);
  }

  // ---------- Places ----------

  @Get(AdminPath.Discover.places)
  async listPlaces(
    @Query('citySlug') citySlug?: string,
    @Query('category') category?: PoiCategory,
  ): Promise<AdminAllPlacesResponse> {
    return { places: await this.service.listPlaces(citySlug, category) };
  }

  @Get(AdminPath.Discover.placeBySlug)
  async getPlace(@Param('slug') slug: string): Promise<AdminPlaceResponse> {
    return { place: await this.service.getPlace(slug) };
  }

  @Post(AdminPath.Discover.places)
  async createPlace(@Body() dto: CreatePlaceDto): Promise<AdminPlaceResponse> {
    return { place: await this.service.createPlace(dto) };
  }

  @Patch(AdminPath.Discover.placeBySlug)
  async updatePlace(
    @Param('slug') slug: string,
    @Body() dto: UpdatePlaceDto,
  ): Promise<AdminPlaceResponse> {
    return { place: await this.service.updatePlace(slug, dto) };
  }

  @Delete(AdminPath.Discover.placeBySlug)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlace(@Param('slug') slug: string): Promise<void> {
    await this.service.deletePlace(slug);
  }

  // ---------- Stats ----------

  @Get(AdminPath.Discover.stats)
  async getStats(): Promise<AdminStatsResponse> {
    return { stats: await this.service.getStats() };
  }
}
