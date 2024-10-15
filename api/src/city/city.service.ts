import {
  AllCityResponse,
  CityByIdResponse,
  SaveCityRequest,
} from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { CityMapper } from './mapper/city.mapper';
import { CityRepository } from './repository/city.repository';

@Injectable()
export class CityService {
  constructor(private readonly cityRepository: CityRepository) {}

  async getAll(): Promise<AllCityResponse> {
    const cities = await this.cityRepository.getAllCities();

    return {
      cities: CityMapper.fromModelsToCities(cities),
    };
  }

  async getById(id: string): Promise<CityByIdResponse> {
    const cities = await this.cityRepository.getCityById(id);

    return {
      city: CityMapper.fromModelToCity(cities),
    };
  }

  async save(request: SaveCityRequest): Promise<CityByIdResponse> {
    const saved = await this.cityRepository.saveCity(
      CityMapper.fromSaveRequestToModel(request),
    );

    return {
      city: CityMapper.fromModelToCity(saved),
    };
  }

  async delete(id: string): Promise<void> {
    const city = await this.cityRepository.getCityById(id);

    //TODO: check if it has route attached if yes throw error
    await this.cityRepository.deleteCity(city._id.toString());
  }
}
