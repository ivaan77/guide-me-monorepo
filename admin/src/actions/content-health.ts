'use server'

import { AdminPath } from '@guide-me-app/core'
import type {
  AdminContentHealth,
  AdminContentHealthResponse,
} from '@guide-me-app/core'
import { adminApi } from '@/lib/api'

export async function getContentHealthAction(): Promise<AdminContentHealth> {
  const res = await adminApi.get<AdminContentHealthResponse>(
    AdminPath.Discover.contentHealth,
  )
  return res.health
}
