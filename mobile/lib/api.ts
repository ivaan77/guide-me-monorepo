import type { Locale } from '@guide-me-app/core'
import { API_URL } from '../config/env'

type GetOptions = {
  locale?: Locale
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8000

// Thin wrapper so every public endpoint uses the same base URL and the
// Accept-Language header. Throws on non-2xx so React Query treats it as error.
// Also enforces a client-side timeout so dropped/unreachable backends don't
// leave the UI hanging in pending state.
export async function apiGet<T>(path: string, opts: GetOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.locale) headers['Accept-Language'] = opts.locale

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort(), {
      once: true,
    })
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new ApiError(res.status, body || res.statusText)
    }

    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
