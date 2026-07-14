import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'crypto'

// On-demand revalidation endpoint. Admin calls this after a blog
// create/update/delete/token-regen so the public web surface picks up
// changes immediately, not on the next 1h ISR window.
//
// Request:
//   POST /api/revalidate?secret=<REVALIDATE_SECRET>
//   Body: { paths: string[] }
// Response:
//   200 { revalidated: string[], skipped: string[] }
//   400 if body malformed
//   401 if secret missing/mismatched
//   503 if REVALIDATE_SECRET is not configured
//
// The secret compare is timing-safe (constant time). We reject any path
// that doesn't start with '/' or that contains a scheme — the caller
// can't force us to revalidate arbitrary external URLs, and Next
// wouldn't accept them anyway.

export type RevalidateRequest = { paths: string[] }
export type RevalidateResponse = {
  revalidated: string[]
  skipped: string[]
}

function safeEqual(a: string, b: string): boolean {
  // timingSafeEqual requires equal-length buffers, so pad the shorter
  // one and still fail if lengths differ. Both cheap; both leak nothing
  // in observable time.
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) {
    // Do a comparison anyway to keep timing consistent.
    timingSafeEqual(ba, Buffer.alloc(ba.length))
    return false
  }
  return timingSafeEqual(ba, bb)
}

export async function POST(request: Request) {
  const configured = process.env.REVALIDATE_SECRET
  if (!configured) {
    return NextResponse.json(
      { message: 'REVALIDATE_SECRET is not configured.' },
      { status: 503 },
    )
  }
  const url = new URL(request.url)
  const provided = url.searchParams.get('secret') ?? ''
  if (!safeEqual(provided, configured)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: RevalidateRequest
  try {
    body = (await request.json()) as RevalidateRequest
  } catch {
    return NextResponse.json(
      { message: 'Expected JSON body' },
      { status: 400 },
    )
  }
  if (
    !body ||
    !Array.isArray(body.paths) ||
    !body.paths.every((p) => typeof p === 'string')
  ) {
    return NextResponse.json(
      { message: 'paths must be a string[]' },
      { status: 400 },
    )
  }

  const revalidated: string[] = []
  const skipped: string[] = []
  for (const path of body.paths) {
    // Guard: must be a same-origin path. Reject schemes + absolute URLs
    // so a malicious payload can't ask us to revalidate '//evil.com'.
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
      skipped.push(path)
      continue
    }
    try {
      revalidatePath(path)
      revalidated.push(path)
    } catch {
      // revalidatePath is synchronous and errors mean the path is
      // structurally invalid to Next — treat as skipped rather than
      // failing the whole request.
      skipped.push(path)
    }
  }

  return NextResponse.json<RevalidateResponse>({ revalidated, skipped })
}
