import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { useQueryClient } from '@tanstack/react-query'

// Watches Clerk's `userId` and clears user-scoped React Query caches
// whenever it changes — including sign-out (userId becomes null) and
// account-switch (userId changes to a new value). Without this the
// previous user's favorites remain in cache and useToggleFavorite still
// reports them as "favorited".
//
// Placed inside QueryClientProvider but outside the rest of the app, so
// the invalidation happens before any consumer reads stale data.
export function AuthCacheBridge() {
  const { userId, isLoaded } = useAuth()
  const qc = useQueryClient()
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isLoaded) return
    const prev = prevUserIdRef.current
    if (prev !== undefined && prev !== userId) {
      // User changed (signed out OR switched accounts). Drop everything
      // that could be scoped to the previous identity. `me` is the only
      // authed cache for now; expand here if more get added.
      qc.removeQueries({ queryKey: ['me'] })
    }
    prevUserIdRef.current = userId ?? null
  }, [isLoaded, userId, qc])

  return null
}
