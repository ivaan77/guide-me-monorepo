'use server'

import { revalidatePath } from 'next/cache'
import { AdminPath } from '@guide-me-app/core'
import type {
  AdminAllPlacesResponse,
  AdminCreatePlaceRequest,
  AdminPlace,
  AdminPlaceResponse,
  AdminUpdatePlaceRequest,
  PoiCategory,
} from '@guide-me-app/core'
import { adminApi, ApiError } from '@/lib/api'
import type { ActionResult } from './cities'

export async function listPlacesAction(
  citySlug?: string,
  category?: PoiCategory,
): Promise<AdminPlace[]> {
  const params = new URLSearchParams()
  if (citySlug) params.set('citySlug', citySlug)
  if (category) params.set('category', category)
  const qs = params.toString()
  const res = await adminApi.get<AdminAllPlacesResponse>(
    `${AdminPath.Discover.places}${qs ? `?${qs}` : ''}`,
  )
  return res.places
}

export async function getPlaceAction(slug: string): Promise<AdminPlace> {
  const res = await adminApi.get<AdminPlaceResponse>(AdminPath.Discover.getPlace(slug))
  return res.place
}

export async function createPlaceAction(
  input: AdminCreatePlaceRequest,
): Promise<ActionResult<AdminPlace>> {
  try {
    const res = await adminApi.post<AdminPlaceResponse>(
      AdminPath.Discover.places,
      input,
    )
    revalidatePath('/discover/places')
    return { ok: true, data: res.place }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function updatePlaceAction(
  slug: string,
  input: AdminUpdatePlaceRequest,
): Promise<ActionResult<AdminPlace>> {
  try {
    const res = await adminApi.patch<AdminPlaceResponse>(
      AdminPath.Discover.getPlace(slug),
      input,
    )
    revalidatePath('/discover/places')
    revalidatePath(`/discover/places/${slug}`)
    return { ok: true, data: res.place }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function deletePlaceAction(slug: string): Promise<ActionResult> {
  try {
    await adminApi.delete(AdminPath.Discover.getPlace(slug))
    revalidatePath('/discover/places')
    return { ok: true, data: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}
