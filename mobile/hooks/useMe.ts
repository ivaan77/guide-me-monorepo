import { useAuth } from '@clerk/clerk-expo'
import { useQuery } from '@tanstack/react-query'
import { type MeResponse, MePath } from '@guide-me-app/core'
import { apiGetAuthed, UnauthorizedError } from '../lib/authedApi'

// Fetches /me which returns the user's favorites (and lazily creates the
// User record server-side on first authed hit). Only runs when Clerk has a
// signed-in session — guests get `data: undefined`.
export function useMe() {
  const { isSignedIn, getToken } = useAuth()
  return useQuery({
    queryKey: ['me'],
    enabled: !!isSignedIn,
    queryFn: ({ signal }) =>
      apiGetAuthed<MeResponse>(MePath.me, {
        getToken: () => getToken(),
        signal,
      }),
    staleTime: 30 * 1000,
    retry: (failureCount, err) => {
      // Don't retry if Clerk returns no token mid-request — likely signing out.
      if (err instanceof UnauthorizedError) return false
      return failureCount < 2
    },
  })
}

export const ME_QUERY_KEY = ['me'] as const
