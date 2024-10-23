import { City, SaveCityRequest } from '@guide-me-app/core';
import { City as CityModel, CityDocument } from '../schemas/city.schema';

export class CityMapper {
  static fromModelsToCities = (models: CityDocument[]): City[] => {
    return models.map(CityMapper.fromModelToCity);
  };

  static fromModelToCity = (model: CityDocument): City => {
    return {
      id: model._id.toString(),
      name: model.name,
      location: model.location,
      infoAudio: model.infoAudio,
    };
  };

  static fromSaveRequestToModel = (request: SaveCityRequest): CityModel => {
    return {
      name: request.name,
      location: request.location,
      infoAudio: request.infoAudio,
    };
  };
}
