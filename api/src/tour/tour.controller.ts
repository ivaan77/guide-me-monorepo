import {
  AdminPath,
  CreateTourGuideRequest,
  CreateTourSpotRequest,
  EditTourGuideRequest,
  EditTourSpotRequest,
  TourGuideResponse,
  TourSpotResponse,
} from '@guide-me-app/core';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TourService } from './tour.service';

@Controller()
export class TourController {
  constructor(private readonly tourService: TourService) {}

  @Post(AdminPath.TourSpot.save)
  async saveSpot(
    @Body() request: CreateTourSpotRequest,
  ): Promise<TourSpotResponse> {
    return await this.tourService.saveSpot(request);
  }

  @Get(AdminPath.TourSpot.getAll)
  async getAllSpots(): Promise<TourSpotResponse[]> {
    return await this.tourService.getAllSpots();
  }

  @Delete(AdminPath.TourSpot.delete)
  async deleteSpotById(@Param('id') id: string): Promise<void> {
    await this.tourService.deleteSpot(id);
  }

  @Put(AdminPath.TourSpot.edit)
  async editSpotById(
    @Body() request: EditTourSpotRequest,
  ): Promise<TourSpotResponse> {
    return await this.tourService.editSpot(request);
  }

  @Get(AdminPath.Tour.getAll)
  async getAllTours(): Promise<TourGuideResponse[]> {
    return await this.tourService.getAllTours();
  }

  @Post(AdminPath.Tour.save)
  async saveTourGuide(
    @Body() request: CreateTourGuideRequest,
  ): Promise<TourGuideResponse> {
    return await this.tourService.saveTourGuide(request);
  }

  @Get(AdminPath.Tour.byId)
  async getCityById(@Param('id') id: string): Promise<TourGuideResponse> {
    return await this.tourService.getTourById(id);
  }

  @Put(AdminPath.Tour.edit)
  async editTourGuide(
    @Body() request: EditTourGuideRequest,
  ): Promise<TourGuideResponse> {
    return await this.tourService.editTourGuide(request);
  }
}
