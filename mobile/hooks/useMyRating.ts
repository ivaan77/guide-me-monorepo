import { useCallback } from 'react'
import type { RatingTargetType, RatingValue } from '@guide-me-app/core'
import { useMe } from './useMe'

// Look up the current user's rating for a specific target, if any. Returns
// null when the user is signed out OR hasn't rated this entity. Reads from
// the /me cache — no extra network requests.
export function useMyRating() {
  const { data: me } = useMe()

  return useCallback(
    (targetType: RatingTargetType, targetId: string): RatingValue | null => {
      const hit = me?.ratings?.find(
        (r) => r.targetType === targetType && r.targetId === targetId,
      )
      return hit?.value ?? null
    },
    [me],
  )
}
