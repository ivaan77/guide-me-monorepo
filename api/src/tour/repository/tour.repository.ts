import { CreateTourGuideRequest } from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tour, TourDocument } from '../schemas/tour.schema';

@Injectable()
export class TourRepository {
    constructor(@InjectModel(Tour.name) private tourModel: Model<Tour>) {
    }

    async createTourGuide(request: CreateTourGuideRequest): Promise<TourDocument> {
        const createdTourSpot = new this.tourModel(request);
        return await createdTourSpot.save();
    }

    async findAllTourGuides(): Promise<TourDocument[]> {
        return this.tourModel.find().exec();
    }
}
