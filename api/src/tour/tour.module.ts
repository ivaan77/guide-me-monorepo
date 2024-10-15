import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TourRepository } from './repository/tour.repository';
import { TourSpotRepository } from './repository/tour.spot.repository';
import { Tour, TourSchema } from './schemas/tour.schema';
import { TourSpot, TourSpotSchema } from './schemas/tour.spot.schema';
import { TourController } from './tour.controller';
import { TourService } from './tour.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TourSpot.name, schema: TourSpotSchema },
      { name: Tour.name, schema: TourSchema },
    ]),
  ],
  controllers: [TourController],
  providers: [TourSpotRepository, TourRepository, TourService],
})
export class TourModule {}
