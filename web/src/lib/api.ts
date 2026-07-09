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

// Fetch a public endpoint with a 1h ISR window. Never throws on non-2xx —
// returns null so pages can degrade gracefully (rendering the landing
// without stats is still valid). Only throws for network-level failures
// so build-time issues (misconfigured API_URL) are still loud.
export async function publicFetch<T>(
  path: string,
  revalidateSeconds: number = 3600,
): Promise<T | null> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: revalidateSeconds },
  })
  if (!res.ok) return null
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text) as T
}
