import { TourGuideResponse } from '@guide-me-app/core';
import { CityMapper } from '../../city/mapper/city.mapper';
import { TourDocument } from '../schemas/tour.schema';
import { TourSpotMapper } from './tour.spot.mapper';

export class TourMapper {
  static fromModelsToTourGuideResponses = (
    models: TourDocument[],
  ): TourGuideResponse[] => {
    return models.map(TourMapper.fromModelToTourGuideResponse);
  };

  static fromModelToTourGuideResponse = (
    model: TourDocument,
  ): TourGuideResponse => {
    return {
      id: model.id,
      name: model.name,
      tourSpots: TourSpotMapper.fromModelsToTourSpotResponses(model.tourSpots),
      city: CityMapper.fromModelToCity(model.city),
      directions: model.directions,
    };
  };
}
