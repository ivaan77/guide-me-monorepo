'use server'

import { revalidatePath } from 'next/cache'
import { AdminWebPath } from '@guide-me-app/core'
import type {
  AdminGalleryItem,
  AdminGalleryResponse,
  AdminGalleryUpdateRequest,
} from '@guide-me-app/core'
import { adminApi, ApiError } from '@/lib/api'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function listGalleryAction(): Promise<AdminGalleryItem[]> {
  const res = await adminApi.get<AdminGalleryResponse>(AdminWebPath.gallery)
  return res.items
}

export async function updateGalleryAction(
  input: AdminGalleryUpdateRequest,
): Promise<ActionResult> {
  try {
    await adminApi.patch(AdminWebPath.gallery, input)
    revalidatePath('/web-content')
    return { ok: true, data: undefined }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ApiError ? err.message : String(err),
    }
  }
}
