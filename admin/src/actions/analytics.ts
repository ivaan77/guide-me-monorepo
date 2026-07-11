'use server'

import { PublicPath } from '@guide-me-app/core'
import type {
  PublicPopularGalleryResponse,
  PublicPopularItem,
  PublicUsageStats,
  PublicUsageStatsResponse,
} from '@guide-me-app/core'
import { adminApi } from '@/lib/api'

// Admin surfaces read the same PUBLIC analytics endpoints the marketing web
// consumes. The endpoints are cached 1h server-side, so admin sees the same
// numbers the landing page shows — no separate freshness state to reason
// about, and no separate PostHog credentials in the admin app.

export async function getUsageStatsAction(): Promise<PublicUsageStats> {
  const res = await adminApi.get<PublicUsageStatsResponse>(
    PublicPath.Web.usageStats,
  )
  return res.stats
}

export async function getPopularGalleryAction(): Promise<PublicPopularItem[]> {
  const res = await adminApi.get<PublicPopularGalleryResponse>(
    PublicPath.Web.popularGallery,
  )
  return res.items
}
