import { API_URL } from '../config/env'

// Authed api client. Pass a `getToken` function (from Clerk's useAuth) so
// every request carries `Authorization: Bearer <session-jwt>`. Throws
// `UnauthorizedError` on a 401 or when getToken returns null — callers
// catch this to trigger the login prompt sheet.

type AuthedOptions = {
  getToken: () => Promise<string | null>
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8000

export class UnauthorizedError extends Error {
  constructor(message = 'Not authenticated') {
    super(message)
    this.name = 'UnauthorizedError'
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

async function authedFetch(
  path: string,
  init: RequestInit,
  opts: AuthedOptions,
): Promise<Response> {
  const token = await opts.getToken()
  if (!token) throw new UnauthorizedError()

  const headers = new Headers(init.headers ?? {})
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
    if (res.status === 401) throw new UnauthorizedError()
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new ApiError(res.status, body || res.statusText)
    }
    return res
  } finally {
    clearTimeout(timeout)
  }
}

export async function apiGetAuthed<T>(
  path: string,
  opts: AuthedOptions,
): Promise<T> {
  const res = await authedFetch(path, { method: 'GET' }, opts)
  return (await res.json()) as T
}

export async function apiPostAuthed<TReq, TRes>(
  path: string,
  body: TReq,
  opts: AuthedOptions,
): Promise<TRes> {
  const res = await authedFetch(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    opts,
  )
  return (await res.json()) as TRes
}

export async function apiDeleteAuthed<TRes>(
  path: string,
  opts: AuthedOptions,
): Promise<TRes> {
  const res = await authedFetch(path, { method: 'DELETE' }, opts)
  return (await res.json()) as TRes
}
