import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { auth } from '@/auth'

// Audio and image uploads. Service-account credentials live only on the
// Next.js server. The browser POSTs multipart/form-data; we forward the
// buffer to GCS and return the public URL.
//
// Request:
//   POST /api/upload (multipart/form-data)
//     file:   File (audio/* or image/*)
//     folder: string (e.g. "excursion/belem/stops/jeronimos" or "city/lisbon")
// Response:
//   200 { url: "https://storage.googleapis.com/<bucket>/<top>/<folder>/<filename>" }
//   400 if file is empty, missing, or wrong MIME type
//   401 if not authenticated
//   503 if GOOGLE_CLOUD_SERVICE_KEY is not configured
//
// Top-level prefix is derived from the file's MIME type:
//   audio/* → audio/
//   image/* → image/

export type UploadResponse = { url: string }

const BASE_URL = 'https://storage.googleapis.com'

function getStorage(): { storage: Storage; bucket: string } | null {
  const key = process.env.GOOGLE_CLOUD_SERVICE_KEY
  const bucket = process.env.GOOGLE_CLOUD_BUCKET ?? 'guide-me-app'
  if (!key) return null
  const decoded = Buffer.from(key, 'base64').toString('utf-8')
  const credentials = JSON.parse(decoded) as Record<string, unknown>
  return { storage: new Storage({ credentials }), bucket }
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
          'Upload is not configured. Set GOOGLE_CLOUD_SERVICE_KEY in admin/.env.local.',
      },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { message: 'Expected multipart/form-data' },
      { status: 400 },
    )
  }

  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string | null) ?? ''

  if (!file) {
    return NextResponse.json({ message: 'No file provided' }, { status: 400 })
  }
  if (file.size < 1) {
    return NextResponse.json({ message: 'File is empty' }, { status: 400 })
  }
  const topPrefix = topPrefixForMime(file.type)
  if (!topPrefix) {
    return NextResponse.json(
      { message: 'Only audio/* or image/* files are accepted.' },
      { status: 400 },
    )
  }

  // Object path: <top>/<folder>/<unique-safeFilename>. We prefix the filename
  // with a short random token so re-uploads of the same filename don't
  // overwrite the previous file (cleaner cache behavior, predictable URLs).
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
  const uniqueName = `${randomToken()}-${safeName}`
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  const objectPath = `${topPrefix}/${cleanFolder ? `${cleanFolder}/` : ''}${uniqueName}`

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await gcs.storage
      .bucket(gcs.bucket)
      .file(objectPath)
      .save(buffer, {
        resumable: false,
        contentType: file.type,
        metadata: { cacheControl: 'public, max-age=31536000' },
      })
  } catch (err) {
    console.error('GCS upload failed', err)
    return NextResponse.json(
      { message: 'Upload failed. Check server logs.' },
      { status: 502 },
    )
  }

  return NextResponse.json<UploadResponse>({
    url: `${BASE_URL}/${gcs.bucket}/${objectPath}`,
  })
}

function topPrefixForMime(mime: string): 'audio' | 'image' | null {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('image/')) return 'image'
  return null
}

function randomToken(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
