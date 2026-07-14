'use server'

import {
  AdminPath,
  type AdminImageGalleryResponse,
  type ImageGalleryEntry,
} from '@guide-me-app/core'
import { adminApi } from '@/lib/api'

// Fetches every distinct image URL already referenced by content docs
// (cities, places, excursions, blogs). Powers the ImageGalleryPicker
// modal. Cached at the fetch layer via next: no-store (see adminApi) —
// gallery contents change with every content edit so we always want
// fresh data.
export async function listImageGalleryAction(): Promise<ImageGalleryEntry[]> {
  const res = await adminApi.get<AdminImageGalleryResponse>(
    AdminPath.ImageGallery.list,
  )
  return res.entries
}
