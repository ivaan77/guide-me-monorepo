import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Sparkles, X } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import type {
  PublicInterestingFact,
  PublicLatLng,
} from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'
import { haversineMeters } from '../../lib/directions'
import { playFactFeedback } from '../../lib/feedback'
import { useAppTheme } from '../../providers/ThemeContext'

// Navy renders well on amber; not a registered Tamagui color token, so we
// pull it from the palette to avoid the validator warning.
const ON_AMBER = palette.navy

// Threshold for a leg to "qualify" as a long walk worth a fact. Either
// dimension passing is enough — a short distance with many traffic lights
// can still be a couple of minutes of standing around, and a brisk 150m
// walk counts even if it's under 2 minutes. Tuned to fire on typical
// city-block legs without being annoying on micro-hops.
const QUALIFYING_DISTANCE_METERS = 150
const QUALIFYING_DURATION_SECONDS = 2 * 60

// Show the first fact after the user has consumed this fraction of the
// leg. Lets them start walking before the banner pops.
const APPEAR_AT_TRAVELLED_FRACTION = 0.2

// One fact roughly per this much walking time. Caps per-leg fact count
// so a long walk gets a few facts, a short walk gets one. With this set
// to 4 minutes: legs >=2min get 1 fact, legs >=8min get 2, etc.
const SECONDS_PER_FACT = 4 * 60

// Default radius for geocoded facts when the editor didn't set one.
// Tighter than the stop arrival default (30m) since facts often anchor
// to a precise object (statue, fountain) rather than a square.
const GEOCODED_FACT_DEFAULT_RADIUS_M = 30

type Props = {
  // Per-leg active fact (chosen by the parent from the unseen pool) plus the
  // total number this leg will surface. The parent owns the pool so it
  // persists across leg transitions and avoids repeats.
  fact: PublicInterestingFact | null
  factIndexInLeg: number
  factsForThisLeg: number
  // Banner is only shown when this is true. Parent gates on phase + walk
  // qualification + budget.
  visible: boolean
  // Top inset so we sit just below the favorite button.
  topOffset: number
  onPressFact: (fact: PublicInterestingFact) => void
  onDismiss: () => void
}

// Self-contained presentational pill. The decisions about WHEN to show
// (long walk?), WHICH fact (pool), and ROTATION (interval) all live in the
// parent. This component just renders + animates the fade.
export function FloatingFactBanner({
  fact,
  factIndexInLeg,
  factsForThisLeg,
  visible,
  topOffset,
  onPressFact,
  onDismiss,
}: Props) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  if (!visible || !fact) return null

  return (
    <Animated.View
      entering={FadeIn.duration(400).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(250)}
      // Re-key on the fact id so a fact swap fades in cleanly.
      key={fact.id}
      style={{
        position: 'absolute',
        top: topOffset,
        right: 20,
        left: 72,
        zIndex: 11,
      }}
    >
      <Pressable onPress={() => onPressFact(fact)}>
        <XStack
          items="center"
          gap="$2.5"
          px="$3"
          py="$2.5"
          rounded="$6"
          bg={c.accent as any}
          style={SHADOW.amberFloating}
        >
          <YStack
            width={32}
            height={32}
            rounded={16}
            items="center"
            justify="center"
            style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
          >
            <Sparkles size={16} color={ON_AMBER as any} />
          </YStack>
          <YStack flex={1} gap="$0.5">
            <SizableText
              size="$1"
              fontFamily="$body"
              fontWeight="700"
              numberOfLines={1}
              style={{
                color: ON_AMBER,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                opacity: 0.75,
              }}
            >
              {factsForThisLeg > 1
                ? `${t('excursion.facts.bannerLabel')} · ${factIndexInLeg + 1}/${factsForThisLeg}`
                : t('excursion.facts.bannerLabel')}
            </SizableText>
            <SizableText
              size="$3"
              fontFamily="$body"
              fontWeight="600"
              numberOfLines={1}
              style={{ color: ON_AMBER }}
            >
              {fact.title}
            </SizableText>
          </YStack>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            hitSlop={8}
          >
            <YStack
              width={24}
              height={24}
              rounded={12}
              items="center"
              justify="center"
              style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
            >
              <X size={12} color={ON_AMBER as any} />
            </YStack>
          </Pressable>
        </XStack>
      </Pressable>
    </Animated.View>
  )
}

// Hook that drives the banner's state machine: which fact is showing right
// now, and when. Lives in the parent so the unseen pool persists across leg
// boundaries and we don't repeat a fact within the same excursion.
//
// Inputs:
//   - `allFacts` — the full ordered list from the api.
//   - `phase` — only 'navigating' triggers facts.
//   - `currentIndex` — the stop the user is walking toward. Used as the
//     "leg id" for resetting per-leg state.
//   - `legDistanceMeters` / `legDurationSeconds` — total leg measurements
//     from fetchWalkingRoute. Used to decide if the leg qualifies and to
//     compute the within-leg appearance schedule.
//   - `remainingMeters` — live distance to the destination, drives the
//     "20% travelled" trigger.
export function useFactBannerSchedule(params: {
  allFacts: PublicInterestingFact[]
  phase: 'preview' | 'navigating' | 'arrived' | 'outro' | 'complete'
  currentIndex: number
  legDistanceMeters: number | null
  legDurationSeconds: number | null
  remainingMeters: number | null
  // Live user location for geocoded fact triggers. When set, any fact
  // whose coords + radius covers the user fires immediately, preempting
  // the distance-based heuristic.
  userLocation: PublicLatLng | null
}): {
  visible: boolean
  fact: PublicInterestingFact | null
  factIndexInLeg: number
  factsForThisLeg: number
  dismiss: () => void
} {
  const {
    allFacts,
    phase,
    currentIndex,
    legDistanceMeters,
    legDurationSeconds,
    remainingMeters,
    userLocation,
  } = params

  // Pool of fact ids not yet shown this excursion. Mutated as we pop entries
  // each time a fact surfaces (heuristic OR geocoded). Re-initialized when
  // the excursion's fact set changes. We split the source list: geocoded
  // facts (with coords) only fire via the geofence effect; non-geocoded
  // facts feed the per-leg heuristic. This way an editor-authored geocoded
  // fact never bleeds into the heuristic pool and double-fires.
  const heuristicPoolRef = useRef<PublicInterestingFact[]>([])
  const geocodedPoolRef = useRef<PublicInterestingFact[]>([])
  const lastFactsRef = useRef<PublicInterestingFact[] | null>(null)
  if (lastFactsRef.current !== allFacts) {
    heuristicPoolRef.current = allFacts.filter((f) => !f.coords)
    geocodedPoolRef.current = allFacts.filter((f) => !!f.coords)
    lastFactsRef.current = allFacts
  }

  // Per-leg state: facts chosen for this leg (already popped from the pool),
  // current index into that array, dismissed flag, and the leg id we
  // initialised for. When the leg changes we reset.
  const [legId, setLegId] = useState(currentIndex)
  const [legFacts, setLegFacts] = useState<PublicInterestingFact[]>([])
  // -1 means "no fact visible yet on this leg". The rotation effect moves
  // it up monotonically once the user crosses the appearance fraction.
  const [factIndexInLeg, setFactIndexInLeg] = useState(-1)
  const [dismissed, setDismissed] = useState(false)
  const [travelled, setTravelled] = useState(0)

  // Reset per-leg state whenever the leg changes. Also recompute the leg's
  // fact quota from its duration and pop that many facts from the pool.
  // Note `factIndexInLeg` starts at -1 (not 0) so a fresh leg is "hidden"
  // until the rotation effect explicitly moves it up. With 0 the banner
  // would briefly show fact #0 during the first render before the rotation
  // effect ran, then snap to -1 — visible flicker.
  useEffect(() => {
    if (currentIndex === legId && legFacts.length > 0) return
    setLegId(currentIndex)
    setDismissed(false)
    setFactIndexInLeg(-1)
    setTravelled(0)
    // Geocoded facts are excursion-scoped (not leg-scoped) — they're
    // already removed from the pool when consumed. But the *display* of
    // an active one shouldn't span legs: clear it so the new leg starts
    // with whatever the new leg deserves (heuristic or fresh geocoded).
    setGeocodedActive(null)

    // Defer fact selection until we know the leg's duration. Until then
    // legFacts stays empty and the banner stays hidden.
    setLegFacts([])
    // We only intentionally re-run when the leg changes. The quota is
    // computed in a separate effect below once the duration arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // When the route metadata arrives for this leg, decide how many facts to
  // surface and pop them from the heuristic pool. Skips legs that don't
  // qualify or when the pool is empty. Geocoded facts are handled by their
  // own effect below and never enter this pool.
  useEffect(() => {
    if (phase !== 'navigating') return
    if (legFacts.length > 0) return
    if (legDistanceMeters == null || legDurationSeconds == null) return
    if (heuristicPoolRef.current.length === 0) return

    const qualifies =
      legDistanceMeters >= QUALIFYING_DISTANCE_METERS ||
      legDurationSeconds >= QUALIFYING_DURATION_SECONDS
    if (!qualifies) return

    const quota = Math.max(1, Math.floor(legDurationSeconds / SECONDS_PER_FACT))
    const take = Math.min(quota, heuristicPoolRef.current.length)
    const chosen = heuristicPoolRef.current.slice(0, take)
    heuristicPoolRef.current = heuristicPoolRef.current.slice(take)
    setLegFacts(chosen)
  }, [phase, legDistanceMeters, legDurationSeconds, legFacts.length])

  // Geocoded fact trigger. On each GPS update during navigation, check
  // every fact in the geocoded pool: if the user is within its radius,
  // consume it and surface it as the active fact (preempts any heuristic
  // pick). One-shot — once consumed, the fact is gone from the pool for
  // the rest of the excursion. Bypasses qualification + budget.
  const [geocodedActive, setGeocodedActive] =
    useState<PublicInterestingFact | null>(null)
  useEffect(() => {
    if (phase !== 'navigating') return
    if (!userLocation) return
    if (geocodedPoolRef.current.length === 0) return
    for (let i = 0; i < geocodedPoolRef.current.length; i++) {
      const fact = geocodedPoolRef.current[i]
      if (!fact.coords) continue
      const radius = fact.triggerRadius ?? GEOCODED_FACT_DEFAULT_RADIUS_M
      const dist = haversineMeters(userLocation, fact.coords)
      if (dist <= radius) {
        // Consume this fact: remove from pool, set as the active geocoded
        // one. The visible/currentFact selectors prefer the geocoded fact
        // over the heuristic one.
        geocodedPoolRef.current = geocodedPoolRef.current.filter(
          (f) => f.id !== fact.id,
        )
        setGeocodedActive(fact)
        // Also un-dismiss the banner — a new fact deserves to be seen.
        setDismissed(false)
        break
      }
    }
  }, [phase, userLocation])

  // Track travelled distance. We only have remaining + total, so derive
  // travelled = total - remaining (clamped non-negative).
  useEffect(() => {
    if (legDistanceMeters == null || remainingMeters == null) return
    setTravelled(Math.max(0, legDistanceMeters - remainingMeters))
  }, [legDistanceMeters, remainingMeters])

  // Schedule rotation through `legFacts` based on travelled distance. Facts
  // are spaced evenly across the leg starting at APPEAR_AT_TRAVELLED_FRACTION
  // — so 3 facts on a leg show at 20%, 60%, 100% (approx).
  //
  // High-water-mark behaviour: once a fact has appeared, we never go back to
  // -1 (hidden) on the same leg even if GPS jitter pushes the projected
  // fraction temporarily below the threshold. Likewise we never decrement
  // the index. This keeps the banner stable on real walks where remaining-
  // distance estimates wobble by a few meters tick-to-tick.
  useEffect(() => {
    if (legFacts.length === 0 || legDistanceMeters == null) return
    const fraction = travelled / legDistanceMeters
    if (fraction < APPEAR_AT_TRAVELLED_FRACTION) {
      // Not far enough into the walk yet. Only hide if we never showed a
      // fact this leg; otherwise keep the current index pinned.
      if (factIndexInLeg < 0) setFactIndexInLeg(-1)
      return
    }
    let nextIdx: number
    if (legFacts.length === 1) {
      nextIdx = 0
    } else {
      const span = 1 - APPEAR_AT_TRAVELLED_FRACTION
      const step = span / legFacts.length
      nextIdx = Math.min(
        legFacts.length - 1,
        Math.floor((fraction - APPEAR_AT_TRAVELLED_FRACTION) / step),
      )
    }
    // Monotonic: never go backwards.
    if (nextIdx > factIndexInLeg) setFactIndexInLeg(nextIdx)
  }, [travelled, legDistanceMeters, legFacts.length, factIndexInLeg])

  // Visibility: a geocoded fact (if active) always wins over the heuristic
  // pick. Both paths still respect the user's dismiss action.
  const heuristicVisible =
    legFacts.length > 0 &&
    factIndexInLeg >= 0 &&
    factIndexInLeg < legFacts.length
  const visible =
    phase === 'navigating' &&
    !dismissed &&
    (geocodedActive != null || heuristicVisible)

  const currentFact = useMemo(() => {
    if (!visible) return null
    if (geocodedActive) return geocodedActive
    return factIndexInLeg >= 0 ? (legFacts[factIndexInLeg] ?? null) : null
  }, [visible, geocodedActive, factIndexInLeg, legFacts])

  // When a geocoded fact is active, the index/total labels in the banner
  // make less sense ("Fact 1/1"). Hide them by reporting 1 of 1.
  const factsForThisLeg = geocodedActive ? 1 : legFacts.length

  // Fire haptic + ping whenever a new fact actually appears. We watch the
  // fact id (not the index) so a swap to a different fact in the same slot
  // also triggers, and a re-render with the same fact doesn't.
  const lastNotifiedFactIdRef = useRef<string | null>(null)
  useEffect(() => {
    const id = currentFact?.id ?? null
    if (id && id !== lastNotifiedFactIdRef.current) {
      playFactFeedback()
    }
    lastNotifiedFactIdRef.current = id
  }, [currentFact])

  return {
    visible,
    fact: currentFact,
    factIndexInLeg: geocodedActive ? 0 : Math.max(0, factIndexInLeg),
    factsForThisLeg,
    dismiss: () => {
      // Clear any geocoded active fact too — dismiss means "I saw it,
      // don't show it again right now". The heuristic also halts via
      // the dismissed flag.
      setGeocodedActive(null)
      setDismissed(true)
    },
  }
}
