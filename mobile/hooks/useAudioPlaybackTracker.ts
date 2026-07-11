import { useEffect, useRef } from 'react'
import { usePostHog } from 'posthog-react-native'

// Minimum accumulated ms before we bother emitting an event. Below this
// threshold the user hasn't meaningfully listened — a stray play/pause
// tap shouldn't ping analytics.
const MIN_EMIT_MS = 2_000

type SourceType = 'stop' | 'sub_stop' | 'fact' | 'place' | 'city' | 'outro'

type Options = {
  isPlaying: boolean
  // Source metadata attached to the event — lets us slice "hours listened
  // per source type" if we ever want that breakdown. `sourceId` is the slug
  // of the excursion / place / city / fact.
  sourceType: SourceType
  sourceId?: string | null
  // Opt out cleanly — the AudioPlayer sometimes renders with null audioUrl
  // and we don't want to track those.
  enabled?: boolean
}

// Accumulates listened-time while the parent audio component is playing
// and emits ONE `audio_played` event when playback stops or the component
// unmounts. The event carries `duration_ms` (integer) + source labels so
// the API can sum it into the marketing "hours listened" counter.
//
// Uses wall-clock deltas rather than the player's currentTime so seeks
// don't confuse the accumulator (a jump forward 30s doesn't record 30s
// of listening).
export function useAudioPlaybackTracker({
  isPlaying,
  sourceType,
  sourceId,
  enabled = true,
}: Options) {
  const posthog = usePostHog()
  const accumulatedMsRef = useRef(0)
  // Timestamp when the current playing-segment started. null when paused.
  const segmentStartRef = useRef<number | null>(null)

  // Segment control — start/stop the wall-clock timer as isPlaying flips.
  useEffect(() => {
    if (!enabled) return
    if (isPlaying) {
      if (segmentStartRef.current == null) {
        segmentStartRef.current = Date.now()
      }
    } else if (segmentStartRef.current != null) {
      accumulatedMsRef.current += Date.now() - segmentStartRef.current
      segmentStartRef.current = null
    }
  }, [isPlaying, enabled])

  // Flush accumulated ms on unmount (component gone → session over) and
  // whenever the parent swaps sourceId (different track — emit the prior
  // and reset).
  useEffect(() => {
    return () => {
      // Close any open segment on unmount.
      if (segmentStartRef.current != null) {
        accumulatedMsRef.current += Date.now() - segmentStartRef.current
        segmentStartRef.current = null
      }
      const total = accumulatedMsRef.current
      if (total >= MIN_EMIT_MS && posthog) {
        posthog.capture('audio_played', {
          duration_ms: Math.round(total),
          source_type: sourceType,
          source_id: sourceId ?? null,
        })
      }
      accumulatedMsRef.current = 0
    }
    // Intentionally exclude posthog / sourceId from deps — the cleanup
    // captures the current values via closure and fires when this
    // instance goes away. Changing sourceId mid-lifecycle should trigger
    // an emit; that's handled by the parent unmounting/remounting the
    // component when the source changes (each stop/fact renders its own
    // player instance).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
