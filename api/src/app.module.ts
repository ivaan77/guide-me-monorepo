import { Module } from '@nestjs/common';
import { CityController } from './city/city.controller';
import { CityService } from './city/city.service';

@Module({
  imports: [],
  controllers: [CityController],
  providers: [CityService],
})
export class AppModule {}
