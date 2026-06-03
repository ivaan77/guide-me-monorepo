'use server'

import { AdminPath } from '@guide-me-app/core'
import type { AdminStats, AdminStatsResponse } from '@guide-me-app/core'
import { adminApi } from '@/lib/api'

export async function getStatsAction(): Promise<AdminStats> {
  const res = await adminApi.get<AdminStatsResponse>(AdminPath.Discover.stats)
  return res.stats
}
