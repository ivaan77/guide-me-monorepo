import Constants from 'expo-constants'

const API_PORT = 3001

// Resolution order:
//   1. EXPO_PUBLIC_API_URL env var (explicit override)
//   2. Expo Metro host (auto-detect in dev — follows whatever IP Metro is running on)
//   3. localhost fallback (mainly for web / unusual environments)
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`
  }

  return `http://localhost:${API_PORT}`
}

export const API_URL = resolveApiUrl()
