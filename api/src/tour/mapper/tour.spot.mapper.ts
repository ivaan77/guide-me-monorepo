import { TourSpotResponse } from '@guide-me-app/core';
import { TourSpotDocument } from '../schemas/tour.spot.schema';

export class TourSpotMapper {
  static fromModelsToTourSpotResponses = (
    models: TourSpotDocument[],
  ): TourSpotResponse[] => {
    return models.map(TourSpotMapper.fromModelToTourSpotResponse);
  };

  static fromModelToTourSpotResponse = (
    model: TourSpotDocument,
  ): TourSpotResponse => {
    return {
      id: model.id,
      name: model.name,
      audio: model.audio,
      images: model.images,
      location: model.location,
    };
  };
}
