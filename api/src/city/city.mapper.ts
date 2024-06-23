import { City, SaveCityRequest } from '@guide-me-app/core';
import { CityModel, SaveCityModel } from './city.repository';

export class CityMapper {
    private constructor() {
    }

    static fromModelsToCities = (models: CityModel[]): City[] => {
        return models.map(CityMapper.fromModelToCity);
    };

    static fromModelToCity = (model: CityModel): City => {
        return {
            id: model._id.toString(),
            name: model.name
        };
    };

    static fromSaveRequestToModel = (request: SaveCityRequest): SaveCityModel => {
        return {
            name: request.name,
        };
    };
}