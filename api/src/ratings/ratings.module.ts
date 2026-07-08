import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import {
  DiscoverCity,
  DiscoverCitySchema,
} from '../discover/schemas/discover-city.schema';
import {
  DiscoverExcursion,
  DiscoverExcursionSchema,
} from '../discover/schemas/discover-excursion.schema';
import {
  DiscoverPlace,
  DiscoverPlaceSchema,
} from '../discover/schemas/discover-place.schema';
import { RatingsController } from './ratings.controller';
import { RatingsRepository } from './ratings.repository';
import { RatingsService } from './ratings.service';
import { Rating, RatingSchema } from './schemas/rating.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: DiscoverCity.name, schema: DiscoverCitySchema },
      { name: DiscoverExcursion.name, schema: DiscoverExcursionSchema },
      { name: DiscoverPlace.name, schema: DiscoverPlaceSchema },
    ]),
  ],
  controllers: [RatingsController],
  providers: [RatingsService, RatingsRepository, ClerkAuthGuard],
  exports: [RatingsService, RatingsRepository],
})
export class RatingsModule {}
