import { Module, forwardRef } from '@nestjs/common';
import { DiscoverModule } from '../discover/discover.module';
import { RatingsModule } from '../ratings/ratings.module';
import { PopularGalleryService } from './popular-gallery.service';
import { PostHogQueryService } from './posthog-query.service';
import { UsageStatsService } from './usage-stats.service';

// Standalone module so the analytics service can be consumed by both the
// public discover controller (for /public/web/usage-stats + popular
// gallery) and any future admin surface without dragging discover-specific
// deps around.
//
// forwardRef on DiscoverModule breaks the cycle: DiscoverModule imports
// AnalyticsModule (to use UsageStatsService in the public controller), and
// AnalyticsModule needs DiscoverModule's exports (DiscoverRepository) to
// hydrate popular-gallery items. Same pattern for RatingsModule (which we
// need for the ratings aggregate in UsageStatsService).
@Module({
  imports: [forwardRef(() => DiscoverModule), forwardRef(() => RatingsModule)],
  providers: [PostHogQueryService, UsageStatsService, PopularGalleryService],
  exports: [UsageStatsService, PopularGalleryService],
})
export class AnalyticsModule {}
