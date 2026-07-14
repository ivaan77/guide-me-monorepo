import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { auth } from '@/auth'

// Lists every image object stored under the `image/` prefix of the GCS
// bucket. Backs the Media page's "Browse" tab. Auth-gated (same session
// guard as the upload route).
//
// Response:
//   200 { items: [{ url, name, sizeBytes, createdAt }] }
//   401 if not authenticated
//   503 if GOOGLE_CLOUD_SERVICE_KEY is not configured
//
// No pagination for now — the bucket holds a few hundred items at most,
// even a year in. If it grows past ~5k we should switch to a paginated
// getFiles({ maxResults, pageToken }) walk.

export type MediaItem = {
  url: string
  name: string
  sizeBytes: number
  // ISO timestamp when the object was created in GCS.
  createdAt: string
}
export type MediaListResponse = { items: MediaItem[] }

const BASE_URL = 'https://storage.googleapis.com'

function getStorage(): { storage: Storage; bucket: string } | null {
  const key = process.env.GOOGLE_CLOUD_SERVICE_KEY
  const bucket = process.env.GOOGLE_CLOUD_BUCKET ?? 'guide-me-app'
  if (!key) return null
  const decoded = Buffer.from(key, 'base64').toString('utf-8')
  const credentials = JSON.parse(decoded) as Record<string, unknown>
  return { storage: new Storage({ credentials }), bucket }
}

export async function GET() {
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

  try {
    const [files] = await gcs.storage.bucket(gcs.bucket).getFiles({
      prefix: 'image/',
    })
    const items: MediaItem[] = files
      // Filter out "folder placeholder" objects (paths ending in `/`);
      // GCS doesn't have real folders but sometimes prefix entries show up.
      .filter((file) => !file.name.endsWith('/'))
      .map((file) => ({
        url: `${BASE_URL}/${gcs.bucket}/${file.name}`,
        name: file.name,
        sizeBytes: Number(file.metadata.size ?? 0),
        // GCS returns timeCreated as an ISO string on the metadata block.
        createdAt:
          (file.metadata.timeCreated as string | undefined) ??
          new Date(0).toISOString(),
      }))
      // Newest first — matches "recently uploaded" intent.
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return NextResponse.json<MediaListResponse>({ items })
  } catch (err) {
    console.error('GCS list failed', err)
    return NextResponse.json(
      { message: 'List failed. Check server logs.' },
      { status: 502 },
    )
  }
}
