import { Module } from '@nestjs/common';
import { CacheModule } from '../../cache/cache.module';
import { DiscoverModule } from '../../discover/discover.module';
import { AdminDiscoverController } from './admin-discover.controller';
import { AdminDiscoverService } from './admin-discover.service';

@Module({
  imports: [CacheModule, DiscoverModule],
  controllers: [AdminDiscoverController],
  providers: [AdminDiscoverService],
})
export class AdminDiscoverModule {}
