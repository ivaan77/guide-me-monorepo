import { CreateTourSpotRequest, EditTourSpotRequest } from '@guide-me-app/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TourSpot, TourSpotDocument } from '../schemas/tour.spot.schema';

@Injectable()
export class TourSpotRepository {
  constructor(
    @InjectModel(TourSpot.name) private tourSpotModel: Model<TourSpot>,
  ) {}

  async create(request: CreateTourSpotRequest): Promise<TourSpotDocument> {
    const createdTourSpot = new this.tourSpotModel(request);
    return await createdTourSpot.save();
  }

  async edit(request: EditTourSpotRequest): Promise<TourSpotDocument> {
    const tourSpotDocument = await this.tourSpotModel.findByIdAndUpdate(
      request.id,
      { $set: request },
      { new: true, runValidators: true },
    );

    if (!tourSpotDocument) {
      throw new NotFoundException(`Tour spot with ID ${request.id} not found`);
    }

    return tourSpotDocument;
  }

  async findAll(): Promise<TourSpotDocument[]> {
    return await this.tourSpotModel.find().exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.tourSpotModel.findByIdAndDelete(id);
  }
}
