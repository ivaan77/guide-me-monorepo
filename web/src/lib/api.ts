import 'server-only'

// Public marketing site fetches from the API's public routes only — no
// admin token, no session. Same env var the mobile app uses in dev
// (fallback URL differs since the web is server-rendered locally on 3000
// while the api runs on 3001). In prod both env values are set via the
// Vercel dashboard.
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001'

export class WebApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'WebApiError'
  }
}

// Fetch a public endpoint with an ISR window. Returns null on ANY failure:
// non-2xx status, network error (API down), timeout, unparseable body. The
// landing page treats null as "hide this section" so a temporary API blip
// or a build-time fetch (before the API is running) doesn't break the
// static export. Silent by design — every consumer already handles null,
// and the marketing site is read-only content, not an app.
export async function publicFetch<T>(
  path: string,
  revalidateSeconds: number = 3600,
): Promise<T | null> {
  const url = `${API_URL}${path}`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: revalidateSeconds },
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
