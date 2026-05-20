import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscoverController } from './discover.controller';
import { DiscoverRepository } from './discover.repository';
import { DiscoverService } from './discover.service';
import {
  DiscoverCity,
  DiscoverCitySchema,
} from './schemas/discover-city.schema';
import {
  DiscoverExcursion,
  DiscoverExcursionSchema,
} from './schemas/discover-excursion.schema';
import {
  DiscoverPlace,
  DiscoverPlaceSchema,
} from './schemas/discover-place.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiscoverCity.name, schema: DiscoverCitySchema },
      { name: DiscoverExcursion.name, schema: DiscoverExcursionSchema },
      { name: DiscoverPlace.name, schema: DiscoverPlaceSchema },
    ]),
  ],
  controllers: [DiscoverController],
  providers: [DiscoverService, DiscoverRepository],
  exports: [DiscoverRepository], // exposed so the seed script can use it
})
export class DiscoverModule {}
