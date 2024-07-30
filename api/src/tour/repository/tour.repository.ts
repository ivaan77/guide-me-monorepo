import { CreateTourGuideRequest } from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tour, TourDocument } from '../schemas/tour.schema';

@Injectable()
export class TourRepository {
    constructor(@InjectModel(Tour.name) private tourModel: Model<Tour>) {
    }

    async create(request: CreateTourGuideRequest): Promise<TourDocument> {
        const createdTourSpot = new this.tourModel(request);
        return (await createdTourSpot.save()).populate(['city', 'tourSpots']);
    }

    async findAll(): Promise<TourDocument[]> {
        return await this.tourModel.find().populate(['city', 'tourSpots']).exec();
    }

    async findById(id: string): Promise<TourDocument> {
        return await this.tourModel.findById(id).populate(['city', 'tourSpots']).exec();
    }
}
