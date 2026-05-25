'use server'

import { revalidatePath } from 'next/cache'
import { AdminPath } from '@guide-me-app/core'
import type {
  AdminAllExcursionsResponse,
  AdminCreateExcursionRequest,
  AdminExcursion,
  AdminExcursionResponse,
  AdminUpdateExcursionRequest,
} from '@guide-me-app/core'
import { adminApi, ApiError } from '@/lib/api'
import type { ActionResult } from './cities'

export async function listExcursionsAction(citySlug?: string): Promise<AdminExcursion[]> {
  const qs = citySlug ? `?citySlug=${encodeURIComponent(citySlug)}` : ''
  const res = await adminApi.get<AdminAllExcursionsResponse>(
    `${AdminPath.Discover.excursions}${qs}`,
  )
  return res.excursions
}

export async function getExcursionAction(slug: string): Promise<AdminExcursion> {
  const res = await adminApi.get<AdminExcursionResponse>(
    AdminPath.Discover.getExcursion(slug),
  )
  return res.excursion
}

export async function createExcursionAction(
  input: AdminCreateExcursionRequest,
): Promise<ActionResult<AdminExcursion>> {
  try {
    const res = await adminApi.post<AdminExcursionResponse>(
      AdminPath.Discover.excursions,
      input,
    )
    revalidatePath('/discover/excursions')
    return { ok: true, data: res.excursion }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function updateExcursionAction(
  slug: string,
  input: AdminUpdateExcursionRequest,
): Promise<ActionResult<AdminExcursion>> {
  try {
    const res = await adminApi.patch<AdminExcursionResponse>(
      AdminPath.Discover.getExcursion(slug),
      input,
    )
    revalidatePath('/discover/excursions')
    revalidatePath(`/discover/excursions/${slug}`)
    return { ok: true, data: res.excursion }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function deleteExcursionAction(slug: string): Promise<ActionResult> {
  try {
    await adminApi.delete(AdminPath.Discover.getExcursion(slug))
    revalidatePath('/discover/excursions')
    return { ok: true, data: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}
