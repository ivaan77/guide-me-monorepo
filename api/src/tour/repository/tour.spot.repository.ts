import { CreateTourSpotRequest } from '@guide-me-app/core';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TourSpot, TourSpotDocument } from '../schemas/tour.spot.schema';

@Injectable()
export class TourSpotRepository {
    constructor(@InjectModel(TourSpot.name) private tourSpotModel: Model<TourSpot>) {
    }

    async create(request: CreateTourSpotRequest): Promise<TourSpotDocument> {
        const createdTourSpot = new this.tourSpotModel(request);
        return await createdTourSpot.save();
    }

    async findAll(): Promise<TourSpotDocument[]> {
        return await this.tourSpotModel.find().exec();
    }

    async findByIds(ids: string[]): Promise<TourSpotDocument[]> {
        return await this.tourSpotModel.find({ _id: { $in: ids } }).exec();
    }

}
