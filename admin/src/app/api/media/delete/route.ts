import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import {
  AdminPath,
  type AdminImageGalleryResponse,
} from '@guide-me-app/core'
import { adminApi } from '@/lib/api'
import { auth } from '@/auth'

// Batch delete for media library items. Refuses to delete images that
// are still referenced by any content doc (city / place / excursion /
// blog) — the check is server-side and fresh (fetched inside this
// handler), so a stale client cache can't tell us to nuke a linked
// image.
//
// Request:
//   POST /api/media/delete { urls: string[] }
// Response:
//   200 { deleted: string[], skipped: { url, reason }[] }
//   400 if urls[] is missing / empty / non-array
//   401 if not authenticated
//   503 if GOOGLE_CLOUD_SERVICE_KEY is not configured
//
// The bucket + credentials setup mirrors /api/upload and /api/media/list.

export type MediaDeleteRequest = { urls: string[] }
export type MediaDeleteSkipped = {
  url: string
  reason: 'still-referenced' | 'not-in-bucket' | 'invalid-url'
}
export type MediaDeleteResponse = {
  deleted: string[]
  skipped: MediaDeleteSkipped[]
}

const BASE_URL = 'https://storage.googleapis.com'

function getStorage(): { storage: Storage; bucket: string } | null {
  const key = process.env.GOOGLE_CLOUD_SERVICE_KEY
  const bucket = process.env.GOOGLE_CLOUD_BUCKET ?? 'guide-me-app'
  if (!key) return null
  const decoded = Buffer.from(key, 'base64').toString('utf-8')
  const credentials = JSON.parse(decoded) as Record<string, unknown>
  return { storage: new Storage({ credentials }), bucket }
}

// Turns a public URL like
//   https://storage.googleapis.com/<bucket>/image/library/foo.jpg
// into the object path (`image/library/foo.jpg`), or null when the URL
// isn't in our bucket at all. Never returns paths outside the bucket
// prefix — belt-and-suspenders against a malicious payload asking us
// to delete something unrelated.
function urlToObjectPath(url: string, bucket: string): string | null {
  const prefix = `${BASE_URL}/${bucket}/`
  if (!url.startsWith(prefix)) return null
  const path = url.slice(prefix.length)
  // Only allow deletions under image/. We host both audio/ and image/
  // and this endpoint is scoped to images.
  if (!path.startsWith('image/')) return null
  return path
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const gcs = getStorage()
  if (!gcs) {
    return NextResponse.json(
      {
        message:
          'Storage is not configured. Set GOOGLE_CLOUD_SERVICE_KEY in admin/.env.local.',
      },
      { status: 503 },
    )
  }

  let body: MediaDeleteRequest
  try {
    body = (await request.json()) as MediaDeleteRequest
  } catch {
    return NextResponse.json({ message: 'Expected JSON body' }, { status: 400 })
  }
  if (
    !body ||
    !Array.isArray(body.urls) ||
    body.urls.length === 0 ||
    !body.urls.every((u) => typeof u === 'string')
  ) {
    return NextResponse.json(
      { message: 'urls must be a non-empty string array' },
      { status: 400 },
    )
  }

  // TOCTOU guard: recompute the used-URL set right now so a stale
  // client view can't cause us to delete something that got linked to
  // a doc between page load and delete click.
  let usedUrls: Set<string>
  try {
    const gallery = await adminApi.get<AdminImageGalleryResponse>(
      AdminPath.ImageGallery.list,
    )
    usedUrls = new Set(gallery.entries.map((e) => e.url))
  } catch (err) {
    console.error('Gallery fetch failed', err)
    return NextResponse.json(
      { message: 'Could not verify references. Aborted delete.' },
      { status: 502 },
    )
  }

  const deleted: string[] = []
  const skipped: MediaDeleteSkipped[] = []
  const bucket = gcs.storage.bucket(gcs.bucket)

  // Sequential rather than parallel: bucket.file().delete() is cheap
  // and this way one 404 doesn't cascade-fail every other delete in a
  // Promise.all. Batches are small (dozens at most).
  for (const url of body.urls) {
    const path = urlToObjectPath(url, gcs.bucket)
    if (!path) {
      skipped.push({ url, reason: 'invalid-url' })
      continue
    }
    if (usedUrls.has(url)) {
      skipped.push({ url, reason: 'still-referenced' })
      continue
    }
    try {
      await bucket.file(path).delete()
      deleted.push(url)
    } catch (err) {
      // GCS returns 404 as an error too — treat any failure to delete
      // as "not-in-bucket" from the caller's perspective. Server logs
      // still record the real reason.
      console.error('GCS delete failed', path, err)
      skipped.push({ url, reason: 'not-in-bucket' })
    }
  }

  return NextResponse.json<MediaDeleteResponse>({ deleted, skipped })
}
