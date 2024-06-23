import { AllCityResponse, CityByIdResponse, SaveCityRequest } from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { CityMapper } from './city.mapper';
import { deleteCity, getAllCities, getCityById, saveCity } from './city.repository';

@Injectable()
export class CityService {
    async getAll(): Promise<AllCityResponse> {
        const cities = await getAllCities();

        return {
            cities: CityMapper.fromModelsToCities(cities),
        };
    }

    async getById(id: string): Promise<CityByIdResponse> {
        const cities = await getCityById(id);

        return {
            city: CityMapper.fromModelToCity(cities),
        };
    }

    async save(request: SaveCityRequest): Promise<CityByIdResponse> {
        const saved = await saveCity(CityMapper.fromSaveRequestToModel(request));

        return {
            city: CityMapper.fromModelToCity(saved),
        };
    }

    async delete(id: string): Promise<void> {
        const city = await getCityById(id);

        //TODO: check if it has route attached if yes throw error
        await deleteCity(city._id.toString());
    }
}
