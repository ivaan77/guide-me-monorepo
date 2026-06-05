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
import type { PublicInterestingFact } from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { playFactFeedback } from '../../lib/feedback'

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
          bg="$accent"
          style={{
            shadowColor: '#B26B00',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
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
  phase: 'preview' | 'navigating' | 'arrived' | 'complete'
  currentIndex: number
  legDistanceMeters: number | null
  legDurationSeconds: number | null
  remainingMeters: number | null
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
  } = params

  // Pool of fact ids not yet shown this excursion. Mutated as we pop entries
  // each time a fact surfaces. Re-initialized when the excursion's fact set
  // changes (different excursion loaded).
  const poolRef = useRef<PublicInterestingFact[]>([])
  const lastFactsRef = useRef<PublicInterestingFact[] | null>(null)
  if (lastFactsRef.current !== allFacts) {
    poolRef.current = [...allFacts]
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

    // Defer fact selection until we know the leg's duration. Until then
    // legFacts stays empty and the banner stays hidden.
    setLegFacts([])
    // We only intentionally re-run when the leg changes. The quota is
    // computed in a separate effect below once the duration arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // When the route metadata arrives for this leg, decide how many facts to
  // surface and pop them from the pool. Skips legs that don't qualify or
  // when the pool is empty.
  useEffect(() => {
    if (phase !== 'navigating') return
    if (legFacts.length > 0) return
    if (legDistanceMeters == null || legDurationSeconds == null) return
    if (poolRef.current.length === 0) return

    const qualifies =
      legDistanceMeters >= QUALIFYING_DISTANCE_METERS ||
      legDurationSeconds >= QUALIFYING_DURATION_SECONDS
    if (!qualifies) return

    const quota = Math.max(1, Math.floor(legDurationSeconds / SECONDS_PER_FACT))
    const take = Math.min(quota, poolRef.current.length)
    const chosen = poolRef.current.slice(0, take)
    poolRef.current = poolRef.current.slice(take)
    setLegFacts(chosen)
  }, [phase, legDistanceMeters, legDurationSeconds, legFacts.length])

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

  const visible =
    phase === 'navigating' &&
    !dismissed &&
    legFacts.length > 0 &&
    factIndexInLeg >= 0 &&
    factIndexInLeg < legFacts.length

  const currentFact = useMemo(
    () =>
      visible && factIndexInLeg >= 0 ? legFacts[factIndexInLeg] ?? null : null,
    [visible, factIndexInLeg, legFacts],
  )

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
    factIndexInLeg: Math.max(0, factIndexInLeg),
    factsForThisLeg: legFacts.length,
    dismiss: () => setDismissed(true),
  }
}
