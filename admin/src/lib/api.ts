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

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

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
  const json = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const msg = json?.message
    const flat = Array.isArray(msg) ? msg.join('; ') : msg ?? res.statusText
    throw new ApiError(res.status, flat)
  }
  return json as T
}

export const adminApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
