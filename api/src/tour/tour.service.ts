import { CreateTourGuideRequest, CreateTourSpotRequest, TourGuideResponse, TourSpotResponse } from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { TourMapper } from './mapper/tour.mapper';
import { TourSpotMapper } from './mapper/tour.spot.mapper';
import { TourRepository } from './repository/tour.repository';
import { TourSpotRepository } from './repository/tour.spot.repository';

@Injectable()
export class TourService {
    constructor(private readonly tourRepository: TourRepository,
                private readonly tourSpotRepository: TourSpotRepository) {
    }

    async saveTourGuide(request: CreateTourGuideRequest): Promise<TourGuideResponse> {
        const tour = await this.tourRepository.create(request);
        return TourMapper.fromModelToTourGuideResponse(tour);
    }

    async getAllTours(): Promise<TourGuideResponse[]> {
        const tours = await this.tourRepository.findAll();
        return TourMapper.fromModelsToTourGuideResponses(tours);
    }

    async getTourById(tourId: string): Promise<TourGuideResponse> {
        const tour = await this.tourRepository.findById(tourId);

        if (!tour) {
            throw new Error(`No tour with id: ${tourId}`);
        }

        return TourMapper.fromModelToTourGuideResponse(tour);
    }

    async getAllSpots(): Promise<TourSpotResponse[]> {
        const tours = await this.tourSpotRepository.findAll();
        return TourSpotMapper.fromModelsToTourSpotResponses(tours);
    }

    async saveSpot(request: CreateTourSpotRequest): Promise<TourSpotResponse> {
        const tourSpot = await this.tourSpotRepository.create(request);
        return TourSpotMapper.fromModelToTourSpotResponse(tourSpot);
    }

    async deleteSpot(id: string): Promise<void> {
        await this.tourSpotRepository.deleteById(id);
    }
}
