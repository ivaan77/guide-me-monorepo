'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AdminPath } from '@guide-me-app/core'
import type {
  AdminAllCitiesResponse,
  AdminCity,
  AdminCityResponse,
  AdminCreateCityRequest,
  AdminUpdateCityRequest,
} from '@guide-me-app/core'
import { adminApi, ApiError } from '@/lib/api'

export async function listCitiesAction(): Promise<AdminCity[]> {
  const res = await adminApi.get<AdminAllCitiesResponse>(AdminPath.Discover.cities)
  return res.cities
}

export async function getCityAction(slug: string): Promise<AdminCity> {
  const res = await adminApi.get<AdminCityResponse>(AdminPath.Discover.getCity(slug))
  return res.city
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function createCityAction(
  input: AdminCreateCityRequest,
): Promise<ActionResult<AdminCity>> {
  try {
    const res = await adminApi.post<AdminCityResponse>(
      AdminPath.Discover.cities,
      input,
    )
    revalidatePath('/discover/cities')
    return { ok: true, data: res.city }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function updateCityAction(
  slug: string,
  input: AdminUpdateCityRequest,
): Promise<ActionResult<AdminCity>> {
  try {
    const res = await adminApi.patch<AdminCityResponse>(
      AdminPath.Discover.getCity(slug),
      input,
    )
    revalidatePath('/discover/cities')
    revalidatePath(`/discover/cities/${slug}`)
    return { ok: true, data: res.city }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function deleteCityAction(slug: string): Promise<ActionResult> {
  try {
    await adminApi.delete(AdminPath.Discover.getCity(slug))
    revalidatePath('/discover/cities')
    return { ok: true, data: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function createCityRedirect(input: AdminCreateCityRequest) {
  const res = await createCityAction(input)
  if (res.ok) redirect(`/discover/cities/${res.data.slug}`)
  return res
}
