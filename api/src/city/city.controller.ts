import {
  AdminPath,
  AllCityResponse,
  CityByIdResponse,
  SaveCityRequest,
} from '@guide-me-app/core';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CityService } from './city.service';

@Controller()
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get(AdminPath.City.getAll)
  async getAllCities(): Promise<AllCityResponse> {
    return await this.cityService.getAll();
  }

  @Get(AdminPath.City.byId)
  async getCityById(@Param('id') id: string): Promise<CityByIdResponse> {
    return await this.cityService.getById(id);
  }

  @Post(AdminPath.City.save)
  async saveCity(@Body() request: SaveCityRequest): Promise<CityByIdResponse> {
    return await this.cityService.save(request);
  }

  @Delete(AdminPath.City.delete)
  async deleteCity(@Param('id') id: string): Promise<void> {
    return await this.cityService.delete(id);
  }
}
