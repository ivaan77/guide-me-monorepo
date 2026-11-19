import 'server-only'
import { auth } from '@/auth'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new ApiError(401, 'Unauthorized')
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  await requireSession()
  if (!ADMIN_API_TOKEN) {
    throw new ApiError(500, 'ADMIN_API_TOKEN is not configured on the admin server.')
  }
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'x-admin-token': ADMIN_API_TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  // Not every error body is JSON — a 413 raised by Express's body parser (or
  // by a proxy in front of the api) comes back as HTML or plain text. Parsing
  // it unguarded would throw and bury the real status code.
  let json: { message?: unknown } | undefined
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    json = undefined
  }
  if (!res.ok) {
    // 413 means the payload outgrew the api's body limit (see useBodyParser
    // in api/src/main.ts). The raw status text ("Payload Too Large") reads as
    // a generic save failure in the form toast, so name the real cause.
    if (res.status === 413) {
      throw new ApiError(
        413,
        'Content is too large to save. Shorten the longest descriptions, or raise the body limit in api/src/main.ts.',
      )
    }
    const msg = json?.message
    const flat = Array.isArray(msg) ? msg.join('; ') : (msg as string) ?? res.statusText
    throw new ApiError(res.status, flat)
  }
  return json as T
}

export const adminApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
