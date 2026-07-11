import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import type { RatingTargetType } from '@guide-me-app/core'
import {
  isEligibleForPrompt,
  markPrompted,
} from '../providers/RatingPromptLog'
import { useMe } from './useMe'

// Orchestrates when to open a RatingPromptSheet:
//   - Async cooldown checks (per-entity 7-day, global 1/day)
//   - Skip if user already rated
//   - Only prompt signed-in users (guests get the login redirect from the
//     sheet itself, but we don't ambush them with the sheet in the first
//     place — feels bait-and-switch)
//
// Returns { visible, request, openManual, close }.
//   - request(): fires the auto-trigger checks (cooldowns + already-rated).
//     Idempotent — repeated calls in the same session are ignored.
//   - openManual(): user-initiated open (tap the rating badge). Bypasses
//     cooldowns and the already-rated guard so the user can update their
//     rating. Still no-op for guests (they need to sign in first).
export function useRatingPrompt(
  targetType: RatingTargetType,
  targetId: string,
) {
  const { data: me } = useMe()
  const [visible, setVisible] = useState(false)
  const requestedRef = useRef(false)

  const alreadyRated = !!me?.ratings?.find(
    (r) => r.targetType === targetType && r.targetId === targetId,
  )

  const request = useCallback(async () => {
    if (requestedRef.current) return
    requestedRef.current = true
    if (alreadyRated) return
    if (!me) return // guest — don't prompt
    const eligible = await isEligibleForPrompt(targetType, targetId)
    if (!eligible) return
    await markPrompted(targetType, targetId)
    setVisible(true)
  }, [alreadyRated, me, targetType, targetId])

  const openManual = useCallback(async () => {
    // Manual open still gates guests (they should sign in first) but skips
    // cooldowns + already-rated so the user can edit an existing rating.
    // Mark the log anyway so an auto-trigger doesn't stack on top of the
    // manual sheet in the same session.
    if (!me) return
    requestedRef.current = true
    await markPrompted(targetType, targetId)
    setVisible(true)
  }, [me, targetType, targetId])

  const close = useCallback(() => setVisible(false), [])

  // Reset the request lock if the target changes (e.g. user navigates to a
  // different city while this hook is still mounted).
  useEffect(() => {
    requestedRef.current = false
    setVisible(false)
  }, [targetType, targetId])

  return { visible, request, openManual, close, isGuest: !me }
}

// Convenience wrapper for city + place detail screens: fires the prompt
// after `dwellMs` of continuous focus on the screen. Timer pauses when
// the screen loses focus (user backgrounds the app or navigates away)
// and resumes on next focus — engagement time accumulates across visits
// within a session.
//
// Pass `enabled: false` (default true) to hold the timer until data is
// loaded — otherwise we count time spent on a skeleton screen as
// engagement, which it isn't.
export function useDwellRatingPrompt(
  targetType: RatingTargetType,
  targetId: string,
  options?: { dwellMs?: number; enabled?: boolean },
) {
  const dwellMs = options?.dwellMs ?? 30_000
  const enabled = options?.enabled ?? true
  const prompt = useRatingPrompt(targetType, targetId)
  const elapsedRef = useRef(0)
  const focusStartRef = useRef<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return
      focusStartRef.current = Date.now()
      const timeout = setTimeout(
        () => {
          prompt.request()
        },
        Math.max(dwellMs - elapsedRef.current, 0),
      )
      return () => {
        clearTimeout(timeout)
        if (focusStartRef.current !== null) {
          elapsedRef.current += Date.now() - focusStartRef.current
          focusStartRef.current = null
        }
      }
    }, [prompt, dwellMs, enabled]),
  )

  // Reset accumulated dwell time when the target changes.
  useEffect(() => {
    elapsedRef.current = 0
    focusStartRef.current = null
  }, [targetType, targetId])

  return prompt
}
