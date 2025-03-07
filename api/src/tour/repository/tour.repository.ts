import {
  CreateTourGuideRequest,
  EditTourGuideRequest,
} from '@guide-me-app/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tour, TourDocument } from '../schemas/tour.schema';

@Injectable()
export class TourRepository {
  constructor(@InjectModel(Tour.name) private tourModel: Model<Tour>) {}

  async create(request: CreateTourGuideRequest): Promise<TourDocument> {
    const createdTourSpot = new this.tourModel(request);
    return (await createdTourSpot.save()).populate(['city', 'tourSpots']);
  }

  async edit(request: EditTourGuideRequest): Promise<TourDocument> {
    const tourDocument = await this.tourModel
      .findByIdAndUpdate(
        request.id,
        { $set: request },
        { new: true, runValidators: true },
      )
      .populate(['city', 'tourSpots']);

    if (!tourDocument) {
      throw new NotFoundException(`Tour guide with ID ${request.id} not found`);
    }

    return tourDocument;
  }

  async findAll(): Promise<TourDocument[]> {
    return await this.tourModel.find().populate(['city', 'tourSpots']).exec();
  }

  async findById(id: string): Promise<TourDocument> {
    return await this.tourModel
      .findById(id)
      .populate(['city', 'tourSpots'])
      .exec();
  }
}
