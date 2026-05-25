import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DirectionsController } from './directions.controller';
import { DirectionsService } from './directions.service';

@Module({
  imports: [CacheModule],
  controllers: [DirectionsController],
  providers: [DirectionsService],
})
export class DirectionsModule {}
