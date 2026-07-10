import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  AppState,
  Image,
  Linking,
  PanResponder,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { usePostHog } from 'posthog-react-native'
import * as Location from 'expo-location'
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import {
  ChevronDown,
  ChevronLeft,
  LocateFixed,
  MapPin,
  MapPinOff,
  Navigation,
  Play,
  Undo2,
} from '@tamagui/lucide-icons'
import type {
  PublicExcursionOutro,
  PublicExcursionStop,
  PublicInterestingFact,
  PublicLatLng,
  PublicPoi,
  PublicSubStop,
} from '@guide-me-app/core'
import {
  Paragraph,
  SizableText,
  XStack,
  YStack,
  useTheme,
} from 'tamagui'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'
import { AudioPlayer } from '../../common/AudioPlayer'
import { FavoriteButton } from '../../common/FavoriteButton'
import { RatingPromptSheet } from '../../common/RatingPromptSheet'
import { useExcursion } from '../../hooks/useExcursion'
import { useRatingPrompt } from '../../hooks/useRatingPrompt'
import {
  distanceFromPolyline,
  fetchWalkingRoute,
  haversineMeters,
  remainingMetersAlongPolyline,
  splitPolylineAtUser,
} from '../../lib/directions'
import { playArrivalFeedback } from '../../lib/feedback'
import { EmptyState } from '../discover/EmptyState'
import { CLEAN_MAP_STYLE } from './cleanMapStyle'
import { POI_CATEGORY_META } from './poiCategory'
import { ExcursionSkeleton } from './ExcursionSkeleton'
import {
  FloatingFactBanner,
  useFactBannerSchedule,
} from './FloatingFactBanner'
import { FloatingFactPlayer } from './FloatingFactPlayer'
import { NearestStopCallout } from './NearestStopCallout'
import {
  PhaseCard,
  PhaseCardActions,
  PhaseCardBody,
  PhaseCardHeader,
} from './PhaseCard'
import { StartFromPicker } from './StartFromPicker'
import { SubStopPager } from './SubStopPager'
import { PoiDetailSheet } from './PoiDetailSheet'
import { StopDetailSheet } from './StopDetailSheet'
import { StopsList } from './StopsList'
import { ImageLightbox } from '../../common/ImageLightbox'
import {
  BUNDLE_ACCENT,
  StopBundlePin,
  SUB_STOP_RING_RADIUS_METERS,
  SubStopDot,
  ringPositionsAroundParent,
} from './StopBundlePin'
import { SubStopDetailSheet } from './SubStopDetailSheet'
import { UserHeadingPin } from './UserHeadingPin'

// Local aliases — the screen used these names heavily.
type ExcursionStop = PublicExcursionStop
type LatLng = PublicLatLng
type Poi = PublicPoi
type Fact = PublicInterestingFact

type Props = {
  id: string
}

type Phase = 'preview' | 'navigating' | 'arrived' | 'outro' | 'complete'

// Default arrival geofence. Per-stop overrides come from `stop.triggerRadius`
// (set in admin). Increase for stops in dense urban areas where GPS jitters;
// tighten for precise photo-ops.
const DEFAULT_ARRIVAL_RADIUS_METERS = 30
const H_PADDING = 20

export function ExcursionScreen({ id }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const { data: excursion, isPending, isError, refetch } = useExcursion(id)

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }, [router])

  if (isPending) {
    return (
      <YStack flex={1} bg="$background">
        <ExcursionSkeleton />
        <BackButton topInset={insets.top} onPress={goBack} />
      </YStack>
    )
  }

  if (isError || !excursion) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 56}>
        <BackButton topInset={insets.top} onPress={goBack} />
        <EmptyState
          variant="error"
          message={t('excursion.notFound')}
          onRetry={() => refetch()}
        />
      </YStack>
    )
  }

  return (
    <ExcursionBody
      id={id}
      stops={excursion.stops}
      pois={excursion.pois ?? []}
      facts={excursion.interestingFacts ?? []}
      outro={excursion.outro}
      title={excursion.name}
      topInset={insets.top}
      bottomInset={insets.bottom}
      mapRef={mapRef}
      goBack={goBack}
      primary={theme.primary.val}
    />
  )
}

function ExcursionBody({
  id,
  stops,
  pois,
  facts,
  outro,
  title,
  topInset,
  bottomInset,
  mapRef,
  goBack,
  primary,
}: {
  id: string
  stops: ExcursionStop[]
  pois: Poi[]
  facts: Fact[]
  outro?: PublicExcursionOutro
  title: string
  topInset: number
  bottomInset: number
  mapRef: React.RefObject<MapView | null>
  goBack: () => void
  primary: string
}) {
  const [phase, setPhase] = useState<Phase>('preview')
  const ratingPrompt = useRatingPrompt('excursion', id)
  const posthog = usePostHog()

  // Fire the rating prompt shortly after the user hits 'complete' so the
  // CompletePanel renders first and the sheet feels like a follow-up, not
  // an interruption. Cooldowns + "already rated" checks live inside the
  // hook — we just declare the moment.
  useEffect(() => {
    if (phase !== 'complete') return
    const timeout = setTimeout(() => {
      ratingPrompt.request()
    }, 1200)
    return () => clearTimeout(timeout)
  }, [phase, ratingPrompt])

  // Emit exactly one `excursion_completed` per (userSession, excursion). We
  // don't need to guard cross-app-launches because completing the same
  // excursion twice in one PostHog session is signal, not noise — but
  // within a single visit to this screen the phase can bounce complete →
  // outro → complete via user undo. Only fire on the first arrival.
  const completedFiredRef = useRef(false)
  useEffect(() => {
    if (phase !== 'complete') {
      completedFiredRef.current = false
      return
    }
    if (completedFiredRef.current) return
    completedFiredRef.current = true
    posthog?.capture('excursion_completed', {
      excursion_id: id,
      stop_count: stops.length,
    })
  }, [phase, posthog, id, stops.length])

  // `excursion_started` — the first time the user leaves the preview panel
  // in this session. Feeds the top of the funnel (started → arrived → …
  // → completed). Guarded per-mount so navigating between stops or
  // undoing back to preview doesn't re-fire — one "started" per session
  // is the useful semantic.
  const startedFiredRef = useRef(false)
  useEffect(() => {
    if (startedFiredRef.current) return
    if (phase === 'preview') return
    startedFiredRef.current = true
    posthog?.capture('excursion_started', {
      excursion_id: id,
      stop_count: stops.length,
    })
  }, [phase, posthog, id, stops.length])

  const [currentIndex, setCurrentIndex] = useState(0)
  // The stop the user has chosen to begin from. Defaults to 0 (first stop)
  // and only changes when the user explicitly picks a different one via
  // the StartFromPicker. The nearest-stop indicators (map callout, picker
  // row emphasis) are informational — they don't auto-change this value.
  const [startFromIndex, setStartFromIndex] = useState(0)
  // Mirror of currentIndex so handlers like `skip` that fire faster than
  // React batches can read the up-to-date value. Without this, rapid skip
  // taps captured a stale `currentIndex` from their closure and the undo
  // pill kept showing the first-skipped stop's name.
  const currentIndexRef = useRef(0)
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])
  // Pointer into the current stop's subStops array. -1 means "showing the
  // parent intro panel" — bundles start there so the editor-authored
  // bundle audio + description play first, then Next advances into the
  // sub-stops one by one. For single stops the value is irrelevant (the
  // ArrivedPanel branches on isBundle). Mirrored to a ref for the same
  // rapid-tap reason as currentIndex.
  const [currentSubStopIndex, setCurrentSubStopIndex] = useState(-1)
  const currentSubStopIndexRef = useRef(-1)
  useEffect(() => {
    currentSubStopIndexRef.current = currentSubStopIndex
  }, [currentSubStopIndex])
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  // Compass heading in degrees (0 = north, clockwise). Null until the first
  // sample arrives; also null on devices without a magnetometer.
  const [heading, setHeading] = useState<number | null>(null)
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([])
  const [routeMeta, setRouteMeta] = useState<{
    distanceMeters: number
    durationSeconds: number
  } | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  // Flips on after a delay so the "Waiting for location…" toast only
  // appears for users who really aren't getting a fix (poor signal, indoors,
  // simulator with location set to None). Cleared on first GPS arrival.
  const [waitingForGps, setWaitingForGps] = useState(false)
  // Bumped whenever we want to re-evaluate location permission — most
  // importantly when the app foregrounds (user may have just toggled the
  // permission in Settings). Including it in the watch effect's dep array
  // causes the subscription to restart with a fresh permission check.
  const [permissionAttempt, setPermissionAttempt] = useState(0)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setPermissionAttempt((n) => n + 1)
    })
    return () => sub.remove()
  }, [])

  // If permission is granted but no GPS fix lands within 8 seconds, surface
  // a small "Waiting for location…" toast. Auto-dismisses as soon as the
  // first sample arrives. We re-arm on each permission attempt so returning
  // from Settings restarts the timer.
  useEffect(() => {
    if (permissionDenied) {
      setWaitingForGps(false)
      return
    }
    if (userLocation) {
      setWaitingForGps(false)
      return
    }
    const t = setTimeout(() => setWaitingForGps(true), 8000)
    return () => clearTimeout(t)
  }, [permissionDenied, userLocation, permissionAttempt])
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null)
  // Fact currently playing in the FloatingFactPlayer. Non-modal: the map and
  // bottom card stay fully interactive while audio plays. Dismiss = clear =
  // unmount the player = audio stops cleanly.
  const [activeFact, setActiveFact] = useState<Fact | null>(null)
  const [startFromPickerOpen, setStartFromPickerOpen] = useState(false)
  // Sub-stop currently displayed in the SubStopDetailSheet. Holds the
  // sub-stop itself plus its parent stop's id so the favorite button can
  // build the composite id (excursionId:stopId:subStopId).
  const [selectedSubStop, setSelectedSubStop] = useState<{
    sub: PublicSubStop
    parentStopId: string
  } | null>(null)
  // URL of the stop image currently shown in the lightbox; null when closed.
  const [lightboxUri, setLightboxUri] = useState<string | null>(null)
  // Queue of pending undo-skip pills, one per recent skip. Each has its own
  // 10s lifetime and is keyed by `skipKey` so back-to-back skips don't
  // collide. Pills stack visually above the BottomPanel and dismiss
  // independently — tapping one restores that specific skip.
  //
  // Three flavors:
  //  - Stop skip: kind='stop', skippedIndex points at the skipped stop. Undo
  //    restores currentIndex.
  //  - Bundle skip: kind='bundle', skippedIndex points at the parent bundle
  //    stop. Undo restores currentIndex + sets currentSubStopIndex=0 + phase
  //    back to 'arrived'.
  //  - Sub-stop skip: kind='sub-stop', skippedIndex is the parent stop
  //    index, skippedSubStopIndex is the sub-stop position. Undo restores
  //    currentSubStopIndex (parent already correct since we never left the
  //    bundle) and phase to 'arrived'.
  type UndoSkipEntry = {
    skipKey: number
    kind: 'stop' | 'bundle' | 'sub-stop'
    skippedIndex: number
    skippedSubStopIndex?: number
    label: string
    expiresAt: number
  }
  const [undoSkips, setUndoSkips] = useState<UndoSkipEntry[]>([])
  const skipKeyRef = useRef(0)
  // Measured height of the BottomPanel — pills anchor relative to its top.
  const [bottomPanelHeight, setBottomPanelHeight] = useState(0)

  const { height: screenHeight } = useWindowDimensions()

  // Three snap points for the bottom container as a fraction of the screen
  // (mini / default / max). The map fills the inverse so resizing the bottom
  // shrinks the map and vice versa. Default matches the prior 50/50 split
  // closely enough that the screen reads unchanged when first opened.
  const BOTTOM_SNAP_FRACTIONS = [0.15, 0.45, 0.7] as const
  const DEFAULT_SNAP_INDEX = 1
  const snapHeights = useMemo(
    () => BOTTOM_SNAP_FRACTIONS.map((f) => screenHeight * f),
    [screenHeight],
  )
  const [snapIndex, setSnapIndex] = useState<number>(DEFAULT_SNAP_INDEX)
  const bottomHeightAnim = useRef(
    new Animated.Value(snapHeights[DEFAULT_SNAP_INDEX]),
  ).current
  // Plain JS mirror of the animated height — kept in sync via an addListener
  // subscription so PanResponder can read the current value at gesture-grant
  // time without poking the Animated.Value's private _value.
  const bottomHeightRef = useRef(snapHeights[DEFAULT_SNAP_INDEX])
  // Snapshot of the height at the moment a drag begins; used to compute the
  // delta-from-start without accumulating rounding drift across moves.
  const dragStartHeightRef = useRef(snapHeights[DEFAULT_SNAP_INDEX])
  useEffect(() => {
    const id = bottomHeightAnim.addListener(({ value }) => {
      bottomHeightRef.current = value
    })
    return () => bottomHeightAnim.removeListener(id)
  }, [bottomHeightAnim])

  // When the screen height changes (rotation / split-screen on tablets),
  // recompute the snap targets and re-pin the current snap.
  useEffect(() => {
    bottomHeightRef.current = snapHeights[snapIndex]
    bottomHeightAnim.setValue(snapHeights[snapIndex])
  }, [snapHeights, snapIndex, bottomHeightAnim])

  const mapHeightAnim = useMemo(
    () =>
      Animated.subtract(new Animated.Value(screenHeight), bottomHeightAnim),
    [screenHeight, bottomHeightAnim],
  )

  // Map height as a plain number, derived from the current snap. Used by the
  // initial map fit logic (the camera math needs a scalar, not an animated
  // value); the visible <Animated.View> uses mapHeightAnim directly.
  const mapHeight = screenHeight - snapHeights[snapIndex]

  const currentStop = stops[currentIndex]

  // While navigating, push GPS into BestForNavigation + 1Hz so the user pin
  // and remaining-distance feel snappy. Otherwise we use High + 5m distance
  // interval — cheap and good enough for preview / arrived. The subscription
  // restarts whenever the phase toggles in/out of navigating.
  const isNavigating = phase === 'navigating'
  useEffect(() => {
    let posSub: Location.LocationSubscription | null = null
    let headSub: Location.LocationSubscription | null = null
    let cancelled = false

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (cancelled) return
      if (status !== 'granted') {
        setPermissionDenied(true)
        return
      }
      // Permission is granted (possibly just now, after the user returned
      // from Settings). Clear the denied flag so the overlay dismisses on
      // the next render.
      setPermissionDenied(false)
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      if (cancelled) return
      setUserLocation({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      })
      const watchOptions: Location.LocationOptions = isNavigating
        ? {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 0,
          }
        : { accuracy: Location.Accuracy.High, distanceInterval: 5 }
      posSub = await Location.watchPositionAsync(watchOptions, (loc) => {
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
      })
      // Compass heading. Prefer trueHeading (calibrated against true north,
      // matches map orientation); fall back to magHeading when the device
      // can't compute trueHeading (low accuracy / no GPS lock yet).
      headSub = await Location.watchHeadingAsync((h) => {
        if (cancelled) return
        const next =
          h.trueHeading != null && h.trueHeading >= 0
            ? h.trueHeading
            : h.magHeading
        setHeading(next)
      })
    }

    start()
    return () => {
      cancelled = true
      posSub?.remove()
      headSub?.remove()
    }
  }, [isNavigating, permissionAttempt])

  useEffect(() => {
    if (phase !== 'navigating' || !userLocation || !currentStop) return
    const dist = haversineMeters(userLocation, currentStop.coords)
    const radius = currentStop.triggerRadius ?? DEFAULT_ARRIVAL_RADIUS_METERS
    if (dist <= radius) {
      setPhase('arrived')
    }
  }, [phase, userLocation, currentStop])

  // Play success haptic + chime the moment phase becomes 'arrived'. Skip on
  // the initial mount so reopening an already-arrived state doesn't replay
  // the sound — only fires on a genuine transition into arrived.
  const previousPhaseRef = useRef<Phase>(phase)
  useEffect(() => {
    if (phase === 'arrived' && previousPhaseRef.current !== 'arrived') {
      playArrivalFeedback()
    }
    previousPhaseRef.current = phase
  }, [phase])

  // `stop_arrived` — fires once per (session, stop). Deduped by the last
  // arrived index so that undoing out of arrived and re-arriving at the
  // same stop doesn't over-count, but skipping ahead or continuing to a
  // new stop still emits. Uses the same session-scoped ref pattern as
  // completedFiredRef.
  const lastArrivedIndexRef = useRef<number | null>(null)
  useEffect(() => {
    if (phase !== 'arrived') return
    if (lastArrivedIndexRef.current === currentIndex) return
    lastArrivedIndexRef.current = currentIndex
    posthog?.capture('stop_arrived', {
      excursion_id: id,
      stop_id: stops[currentIndex]?.id,
      stop_index: currentIndex,
      total_stops: stops.length,
    })
  }, [phase, currentIndex, posthog, id, stops])

  useEffect(() => {
    if (phase !== 'navigating' || !userLocation || !currentStop) return
    let cancelled = false
    fetchWalkingRoute(userLocation, currentStop.coords).then((route) => {
      if (cancelled || !route) return
      setRoutePolyline(route.polyline)
      setRouteMeta({
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      })
    })
    return () => {
      cancelled = true
    }
  }, [phase, currentIndex, currentStop])


  const initialRegion = useMemo(() => {
    const lats = stops.map((s) => s.coords.latitude)
    const lngs = stops.map((s) => s.coords.longitude)
    const latitude = (Math.min(...lats) + Math.max(...lats)) / 2
    const longitude = (Math.min(...lngs) + Math.max(...lngs)) / 2
    const latDelta = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.6)
    const lngDelta = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.6)
    return {
      latitude,
      longitude,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    }
  }, [stops])

  // Fit map to show all stops + POIs + user location when in preview. We
  // want this to fire ONCE per preview entry: the moment we have either
  // GPS or just the stop coords, we frame everything and then leave the
  // camera alone so the user can pan/zoom freely. Re-running on every
  // userLocation tick (the previous behavior) caused the camera to zoom
  // out every time the simulator location changed.
  const hasFittedPreviewRef = useRef(false)
  useEffect(() => {
    if (phase !== 'preview') {
      hasFittedPreviewRef.current = false
      return
    }
    if (hasFittedPreviewRef.current) return
    const isReal = (c: LatLng) =>
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !(c.latitude === 0 && c.longitude === 0)
    const coords: LatLng[] = [
      ...stops.map((s) => s.coords).filter(isReal),
      ...pois.map((p) => p.coords).filter(isReal),
    ]
    if (userLocation) coords.push(userLocation)
    if (coords.length === 0) return
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: makeEdgePadding(mapHeight),
      animated: true,
    })
    hasFittedPreviewRef.current = true
  }, [phase, stops, pois, userLocation, mapRef, mapHeight])

  // Drag-handle PanResponder for resizing the bottom container. The handle
  // is a small bar at the top of the bottom container; only the handle owns
  // this responder so the inner ScrollView still scrolls normally. On
  // release we snap to the nearest of the three target heights and update
  // `snapIndex` so the camera-fit logic (which uses scalar `mapHeight`) can
  // re-fire.
  const snapPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          // Snapshot the current animated height (mirrored by the listener)
          // so we can compute the drag delta against a stable starting point.
          dragStartHeightRef.current = bottomHeightRef.current
        },
        onPanResponderMove: (_, gesture) => {
          // Drag down (positive dy) shrinks the bottom container; drag up
          // (negative dy) grows it. Clamp to the min/max snap targets so we
          // can't drag outside the snap range.
          const next = dragStartHeightRef.current - gesture.dy
          const min = snapHeights[0]
          const max = snapHeights[snapHeights.length - 1]
          bottomHeightAnim.setValue(Math.max(min, Math.min(max, next)))
        },
        onPanResponderRelease: (_, gesture) => {
          const released = dragStartHeightRef.current - gesture.dy
          let nearestIdx = 0
          let nearestDist = Infinity
          for (let i = 0; i < snapHeights.length; i++) {
            const d = Math.abs(snapHeights[i] - released)
            if (d < nearestDist) {
              nearestDist = d
              nearestIdx = i
            }
          }
          Animated.spring(bottomHeightAnim, {
            toValue: snapHeights[nearestIdx],
            useNativeDriver: false,
            bounciness: 6,
          }).start()
          setSnapIndex(nearestIdx)
        },
        onPanResponderTerminate: () => {
          Animated.spring(bottomHeightAnim, {
            toValue: snapHeights[snapIndex],
            useNativeDriver: false,
            bounciness: 6,
          }).start()
        },
      }),
    [bottomHeightAnim, snapHeights, snapIndex],
  )

  // User-interaction cooldown for the auto-camera. While `Date.now()` is
  // below `userInteractingUntilRef.current` the heading-up animation skips,
  // so the user can pan/zoom freely without the camera yanking back. The
  // re-center button (rendered as an overlay below) clears this immediately
  // and resets the per-leg fitted flag so the next tick re-fires.
  const userInteractingUntilRef = useRef(0)
  const GESTURE_COOLDOWN_MS = 8000
  const markUserInteraction = useCallback(() => {
    userInteractingUntilRef.current = Date.now() + GESTURE_COOLDOWN_MS
  }, [])

  // On entering navigating (or each new leg), zoom the camera to fit both
  // the user and the next stop with padding. After that initial overview
  // lands the heading-up follow-mode below takes over and tracks the user.
  // Guard against missing GPS — we'd otherwise crash on a null coordinate
  // or zoom to a single-point bounding box.
  const hasFittedThisLegRef = useRef(false)
  useEffect(() => {
    // Reset the per-leg flag every time the leg changes or the phase leaves
    // navigating, so a re-entry triggers a fresh fit.
    hasFittedThisLegRef.current = false
  }, [phase, currentIndex])
  useEffect(() => {
    if (phase !== 'navigating' || !userLocation || !currentStop) return
    if (hasFittedThisLegRef.current) return
    if (Date.now() < userInteractingUntilRef.current) return
    // If the user is already on top of the stop (within ~5m of the same
    // coordinate), fitToCoordinates degenerates to absurd zoom. Fall back
    // to a centered camera at the user with the same zoom heading-up uses.
    const same =
      haversineMeters(userLocation, currentStop.coords) < 5
    if (same) {
      mapRef.current?.animateCamera(
        { center: userLocation, heading: 0, pitch: 0, zoom: 17 },
        { duration: 600 },
      )
    } else {
      mapRef.current?.fitToCoordinates(
        [userLocation, currentStop.coords],
        {
          edgePadding: makeEdgePadding(mapHeight),
          animated: true,
        },
      )
    }
    hasFittedThisLegRef.current = true
  }, [phase, currentIndex, userLocation, currentStop, mapRef, mapHeight])

  // Heading-up rotation during navigation. We re-animate the camera whenever
  // the heading changes by at least 5° so the map turns visibly without
  // chattering on every compass tick. Suppressed until the initial fit
  // above has landed, so the overview isn't immediately blown away.
  const lastAnimatedHeadingRef = useRef<number | null>(null)
  useEffect(() => {
    if (phase !== 'navigating' || !userLocation || heading == null) return
    if (!hasFittedThisLegRef.current) return
    if (Date.now() < userInteractingUntilRef.current) return
    const prev = lastAnimatedHeadingRef.current
    if (prev != null) {
      const diff = Math.abs(((heading - prev + 540) % 360) - 180)
      if (diff < 5) return
    }
    lastAnimatedHeadingRef.current = heading
    mapRef.current?.animateCamera(
      {
        center: userLocation,
        heading,
        pitch: 0,
        zoom: 17,
      },
      { duration: 500 },
    )
  }, [phase, userLocation, heading, mapRef])

  // When the user re-enters preview/arrived/complete, reset the camera to
  // north-up so the map is readable as a normal 2D view.
  useEffect(() => {
    if (phase === 'navigating') return
    lastAnimatedHeadingRef.current = null
    mapRef.current?.animateCamera(
      { heading: 0, pitch: 0 },
      { duration: 400 },
    )
  }, [phase, mapRef])

  // Re-center button: clear the gesture cooldown and force the auto-camera
  // to re-fit immediately. Resets the per-leg fitted flag (triggers the fit
  // effect) and the last-heading ref (so heading-up animates next tick).
  const recenter = useCallback(() => {
    userInteractingUntilRef.current = 0
    hasFittedThisLegRef.current = false
    lastAnimatedHeadingRef.current = null
    if (userLocation) {
      mapRef.current?.animateCamera(
        {
          center: userLocation,
          heading: heading ?? 0,
          pitch: 0,
          zoom: 17,
        },
        { duration: 500 },
      )
    }
  }, [userLocation, heading])

  const start = () => {
    const startIdx = Math.max(
      0,
      Math.min(stops.length - 1, startFromIndex),
    )
    setPhase('navigating')
    currentIndexRef.current = startIdx
    setCurrentIndex(startIdx)
    currentSubStopIndexRef.current = -1
    setCurrentSubStopIndex(-1)
    setRoutePolyline([])
    setRouteMeta(null)
  }

  // Helper: advance to the next top-level stop. Used by both Continue and
  // Skip — they share index/phase mechanics, only the undo pill differs.
  // When we're already past the last stop, transition into the outro
  // (if the excursion has one) or jump straight to complete.
  const goToNextStop = () => {
    const nextIndex = currentIndexRef.current + 1
    if (nextIndex >= stops.length) {
      setPhase(outro ? 'outro' : 'complete')
      return
    }
    currentIndexRef.current = nextIndex
    setCurrentIndex(nextIndex)
    currentSubStopIndexRef.current = -1
    setCurrentSubStopIndex(-1)
    setPhase('navigating')
    setRoutePolyline([])
    setRouteMeta(null)
  }

  const continueNext = () => {
    goToNextStop()
  }

  const UNDO_WINDOW_MS = 10_000
  const pushUndoEntry = (
    kind: 'stop' | 'bundle' | 'sub-stop',
    skippedIndex: number,
    label: string,
    skippedSubStopIndex?: number,
  ) => {
    skipKeyRef.current += 1
    const entry: UndoSkipEntry = {
      skipKey: skipKeyRef.current,
      kind,
      skippedIndex,
      skippedSubStopIndex,
      label,
      expiresAt: Date.now() + UNDO_WINDOW_MS,
    }
    setUndoSkips((prev) => [...prev, entry])
  }

  // Top-level Skip (from the navigating panel, or "Skip all spots at X"
  // from a bundle). Drops the entire stop (bundle or single) and pushes
  // an undo pill labeled with the stop's name.
  const skip = () => {
    const skippedIndex = currentIndexRef.current
    const stop = stops[skippedIndex]
    const isBundle = (stop?.subStops?.length ?? 0) > 0
    pushUndoEntry(
      isBundle ? 'bundle' : 'stop',
      skippedIndex,
      stop?.name ?? '',
    )
    goToNextStop()
  }

  // Advance within a bundle. Called by the Next button on the bundle
  // ArrivedPanel. If we're already on the last sub-stop, behaves like
  // continueNext and exits the bundle.
  const advanceSubStop = () => {
    const stop = stops[currentIndexRef.current]
    const total = stop?.subStops?.length ?? 0
    const nextSubIdx = currentSubStopIndexRef.current + 1
    if (nextSubIdx >= total) {
      goToNextStop()
      return
    }
    currentSubStopIndexRef.current = nextSubIdx
    setCurrentSubStopIndex(nextSubIdx)
  }

  // Jump to a specific position within a bundle — powers the inline
  // SubStopPager taps in the ArrivedPanel. `target` is -1 for the bundle
  // intro or 0..N-1 for individual sub-stops. Clamped defensively so a
  // stale pager tap can't push state out of range.
  const jumpToSubStop = useCallback(
    (target: number) => {
      const stop = stops[currentIndexRef.current]
      const total = stop?.subStops?.length ?? 0
      if (total === 0) return
      const clamped = Math.max(-1, Math.min(total - 1, target))
      currentSubStopIndexRef.current = clamped
      setCurrentSubStopIndex(clamped)
    },
    [stops],
  )

  // Skip a single sub-stop within a bundle. Pushes an undo pill labeled
  // with the sub-stop's name (not the bundle). If this was the last
  // sub-stop, advances to the next top-level stop.
  const skipSubStop = () => {
    const stop = stops[currentIndexRef.current]
    const total = stop?.subStops?.length ?? 0
    const subIdx = currentSubStopIndexRef.current
    const subName = stop?.subStops?.[subIdx]?.name ?? ''
    pushUndoEntry('sub-stop', currentIndexRef.current, subName, subIdx)
    const nextSubIdx = subIdx + 1
    if (nextSubIdx >= total) {
      goToNextStop()
      return
    }
    currentSubStopIndexRef.current = nextSubIdx
    setCurrentSubStopIndex(nextSubIdx)
  }

  // Tap of a specific undo pill — restore that pill's skip. Pills are
  // independent: tapping one doesn't dismiss the others. They each fall
  // off on their own 10s timer.
  const undoSkipByKey = useCallback(
    (skipKey: number) => {
      const entry = undoSkips.find((e) => e.skipKey === skipKey)
      if (!entry) return
      if (entry.kind === 'sub-stop' && entry.skippedSubStopIndex != null) {
        // Sub-stop skip happened while we were arrived at the bundle. The
        // user may have since skipped or advanced past the bundle entirely
        // — restoring means jumping back to the bundle's arrived state.
        currentIndexRef.current = entry.skippedIndex
        setCurrentIndex(entry.skippedIndex)
        currentSubStopIndexRef.current = entry.skippedSubStopIndex
        setCurrentSubStopIndex(entry.skippedSubStopIndex)
        setPhase('arrived')
      } else if (entry.kind === 'bundle') {
        currentIndexRef.current = entry.skippedIndex
        setCurrentIndex(entry.skippedIndex)
        currentSubStopIndexRef.current = -1
        setCurrentSubStopIndex(-1)
        setPhase('arrived')
        setRoutePolyline([])
        setRouteMeta(null)
      } else {
        // 'stop' kind — restore the navigating state and let the route
        // refetch effect re-plan from current GPS.
        currentIndexRef.current = entry.skippedIndex
        setCurrentIndex(entry.skippedIndex)
        currentSubStopIndexRef.current = -1
        setCurrentSubStopIndex(-1)
        setPhase('navigating')
        setRoutePolyline([])
        setRouteMeta(null)
      }
      setUndoSkips((prev) => prev.filter((e) => e.skipKey !== skipKey))
    },
    [undoSkips, stops.length],
  )

  // Auto-dismiss each pill at its own expiry. A single timer drives a
  // garbage-collection pass: it wakes on the next-expiring pill, prunes,
  // and reschedules. Keeps the timeout count bounded at 1 regardless of how
  // many pills are queued.
  useEffect(() => {
    if (undoSkips.length === 0) return
    const earliest = undoSkips.reduce(
      (acc, e) => Math.min(acc, e.expiresAt),
      Infinity,
    )
    const ms = Math.max(0, earliest - Date.now())
    const t = setTimeout(() => {
      const now = Date.now()
      setUndoSkips((prev) => prev.filter((e) => e.expiresAt > now))
    }, ms)
    return () => clearTimeout(t)
  }, [undoSkips])

  const finish = () => goBack()

  // Distance to the nearest stop in this excursion. Used to gate the Start
  // button: if the user is wildly far from any stop (i.e. they're not in the
  // city yet), we show a warning + override instead of misleading distances
  // and ETAs. Returns null until GPS arrives so the preview falls back to a
  // normal Start button rather than flashing the warning.
  const FAR_FROM_ROUTE_METERS = 3000
  const nearest = useMemo(() => {
    if (!userLocation || stops.length === 0)
      return { index: null as number | null, meters: null as number | null }
    let bestIdx = 0
    let best = Infinity
    for (let i = 0; i < stops.length; i++) {
      const d = haversineMeters(userLocation, stops[i].coords)
      if (d < best) {
        best = d
        bestIdx = i
      }
    }
    return { index: bestIdx, meters: best }
  }, [userLocation, stops])
  const nearestStopMeters = nearest.meters
  const nearestStopIndex = nearest.index
  const isFarFromRoute =
    nearestStopMeters != null && nearestStopMeters > FAR_FROM_ROUTE_METERS

  // startFromIndex defaults to 0 (the first stop). The nearest stop is
  // *shown* via the map callout and the picker's emphasized row, but it is
  // NOT auto-selected — picking a starting point is an explicit user choice.
  // The user picks via the StartFromPicker; we just store their choice.
  const pickStartFrom = useCallback((idx: number) => {
    setStartFromIndex(idx)
  }, [])

  // One-shot pill that surfaces the nearest stop's name once GPS resolves
  // it during preview. Auto-dismisses on a timer with a visible progress
  // bar drain (the pill renders the countdown itself off `expiresAt`).
  // We track whether we've already shown it for this preview entry via a
  // ref so it doesn't pop again when GPS jitter shifts nearestStopIndex.
  const NEAREST_PILL_LIFETIME_MS = 6000
  const [nearestPillExpiresAt, setNearestPillExpiresAt] = useState<number>(0)
  const nearestPillShownRef = useRef(false)
  useEffect(() => {
    if (phase !== 'preview') {
      nearestPillShownRef.current = false
      setNearestPillExpiresAt(0)
    }
  }, [phase])
  useEffect(() => {
    if (phase !== 'preview') return
    if (nearestStopIndex == null) return
    if (nearestPillShownRef.current) return
    nearestPillShownRef.current = true
    const expires = Date.now() + NEAREST_PILL_LIFETIME_MS
    setNearestPillExpiresAt(expires)
    // Schedule the actual unmount slightly after expiry so the progress
    // bar has a moment to finish its 0-width animation.
    const timer = setTimeout(
      () => setNearestPillExpiresAt(0),
      NEAREST_PILL_LIFETIME_MS + 50,
    )
    return () => clearTimeout(timer)
  }, [phase, nearestStopIndex])

  // Detect when the user has wandered off the active route. GPS in dense
  // urban areas jitters by 20-30m, so a one-tick spike isn't off-route —
  // it has to persist. We compute the current perpendicular distance and
  // mark the user as off-route only after it stays above the threshold for
  // the dwell window. The dwell start ref tracks the first tick the user
  // crossed the threshold; if a later tick brings them back inside, the
  // ref resets.
  const OFF_ROUTE_METERS = 50
  const OFF_ROUTE_DWELL_MS = 5000
  const [isOffRoute, setIsOffRoute] = useState(false)
  const offRouteSinceRef = useRef<number | null>(null)
  useEffect(() => {
    if (
      phase !== 'navigating' ||
      !userLocation ||
      routePolyline.length < 2
    ) {
      offRouteSinceRef.current = null
      setIsOffRoute(false)
      return
    }
    const dist = distanceFromPolyline(userLocation, routePolyline)
    if (dist <= OFF_ROUTE_METERS) {
      offRouteSinceRef.current = null
      if (isOffRoute) setIsOffRoute(false)
      return
    }
    const now = Date.now()
    if (offRouteSinceRef.current == null) {
      offRouteSinceRef.current = now
    }
    if (now - offRouteSinceRef.current >= OFF_ROUTE_DWELL_MS && !isOffRoute) {
      setIsOffRoute(true)
    }
  }, [phase, userLocation, routePolyline, isOffRoute])

  // Manual route recalculation. Triggered by the user from the off-route
  // pill. Refetches the walking route from current GPS to the same stop
  // and resets the per-leg fit so the camera frames the new route.
  const recalculateRoute = useCallback(() => {
    if (!userLocation || !currentStop) return
    setIsOffRoute(false)
    offRouteSinceRef.current = null
    hasFittedThisLegRef.current = false
    fetchWalkingRoute(userLocation, currentStop.coords).then((route) => {
      if (!route) return
      setRoutePolyline(route.polyline)
      setRouteMeta({
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
      })
    })
  }, [userLocation, currentStop])

  // Split the active leg's polyline at the user's projection so we can
  // render the walked portion in grey and the remaining portion in accent.
  // Outside navigation (or before GPS arrives) there's nothing walked yet —
  // fall back to rendering the whole route as "remaining".
  const legPolylineParts = useMemo(() => {
    if (phase !== 'navigating' || !userLocation || routePolyline.length < 2) {
      return { walked: [] as LatLng[], remaining: routePolyline }
    }
    return splitPolylineAtUser(userLocation, routePolyline)
  }, [phase, userLocation, routePolyline])

  // Live distance/ETA that updates with the user's GPS location.
  const liveRouteInfo = useMemo(() => {
    if (
      phase !== 'navigating' ||
      !userLocation ||
      !routeMeta ||
      routePolyline.length < 2
    ) {
      return null
    }
    const remainingMeters = remainingMetersAlongPolyline(
      userLocation,
      routePolyline,
    )
    const ratio =
      routeMeta.distanceMeters > 0
        ? Math.min(1, remainingMeters / routeMeta.distanceMeters)
        : 0
    const remainingSeconds = Math.round(routeMeta.durationSeconds * ratio)
    return { remainingMeters, remainingSeconds }
  }, [phase, userLocation, routeMeta, routePolyline])

  // Drives the floating fact banner. The hook decides per-leg whether the
  // walk is long enough, picks facts from a persistent unseen-pool, and
  // schedules their appearance based on how far through the leg the user is.
  const factBanner = useFactBannerSchedule({
    allFacts: facts,
    phase,
    currentIndex,
    legDistanceMeters: routeMeta?.distanceMeters ?? null,
    legDurationSeconds: routeMeta?.durationSeconds ?? null,
    remainingMeters: liveRouteInfo?.remainingMeters ?? null,
    userLocation,
  })

  return (
    <YStack flex={1} bg="$background">
      <Animated.View style={{ width: '100%', height: mapHeightAnim }}>
      <MapView
        ref={mapRef}
        // Google Maps on both platforms so customMapStyle applies consistently
        // and we get the same renderer + icons across iOS and Android.
        provider={PROVIDER_GOOGLE}
        style={{ width: '100%', height: '100%' }}
        initialRegion={initialRegion}
        // Custom user pin (UserHeadingPin) replaces the system blue dot so
        // we can render the heading cone. The platform's own pin would
        // double up otherwise.
        showsUserLocation={false}
        showsMyLocationButton={false}
        // Hide native map clutter so only our markers show up:
        //   - customMapStyle works on Android (Google) + iOS (only when
        //     provider is PROVIDER_GOOGLE).
        //   - showsPointsOfInterest is the Apple Maps equivalent (iOS
        //     when the provider is undefined). It also hides business
        //     POIs on the default Apple basemap.
        //   - showsBuildings/Traffic/Indoors removed for a calm walking map.
        customMapStyle={CLEAN_MAP_STYLE}
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        // During navigation we rotate the map heading-up via animateCamera;
        // disable the user's manual rotation so the gestures don't fight
        // the auto-rotation. Pan + pinch stay enabled.
        rotateEnabled={phase !== 'navigating'}
        // Pause auto-camera for 8s whenever the user actively pans/pinches.
        // `details.isGesture` distinguishes user input from our own
        // animateCamera calls so the camera doesn't lock itself out.
        onRegionChange={(_region, details) => {
          if (details?.isGesture) markUserInteraction()
        }}
      >
        {/* Stops: hidden during navigation except the current target, so
            the user isn't distracted by behind-them or ahead-of-them pins.
            Bundle stops (subStops non-empty) render as a violet pin with a
            number badge instead of the system pin. */}
        {phase !== 'navigating' &&
          stops.map((stop, idx) => {
            const subCount = stop.subStops?.length ?? 0
            if (subCount > 0) {
              return (
                <StopBundlePin
                  key={stop.id}
                  coords={stop.coords}
                  count={subCount}
                  visited={idx < currentIndex}
                  title={`${idx + 1}. ${stop.name}`}
                  description={stop.description}
                />
              )
            }
            return (
              <Marker
                key={stop.id}
                coordinate={stop.coords}
                title={`${idx + 1}. ${stop.name}`}
                description={stop.description}
                pinColor={idx < currentIndex ? '#9CA3AF' : undefined}
              />
            )
          })}
        {/* Sub-stop dots + auto-sized cluster ring. Always rendered
            (preview, navigating, arrived, complete). Sub-stops have no
            navigation of their own; the dots are informational and
            tappable to open the sub-stop detail sheet. The ring's radius
            is the max distance from the parent to any sub-stop (plus a
            small padding) so every dot sits inside it by construction. */}
        {stops.map((stop) => {
          const subStops = stop.subStops ?? []
          if (subStops.length === 0) return null
          // Real coords drive position; fall back to ring positions only
          // for legacy data (shouldn't happen after the coords backfill,
          // but keeps reads safe).
          const fallbackRing = ringPositionsAroundParent(
            stop.coords,
            subStops.length,
          )
          const dotCoords = subStops.map(
            (s, i) => s.coords ?? fallbackRing[i],
          )
          // Auto-size the ring to encompass every dot. Pad by 30% above
          // the farthest dot and enforce a sensible minimum so a single
          // close sub-stop still shows a visible ring.
          const farthestMeters = dotCoords.reduce(
            (acc, c) => Math.max(acc, haversineMeters(stop.coords, c)),
            0,
          )
          const ringRadius = Math.max(
            SUB_STOP_RING_RADIUS_METERS,
            farthestMeters * 1.3,
          )
          return (
            <Fragment key={`subs:${stop.id}`}>
              <Circle
                center={stop.coords}
                radius={ringRadius}
                strokeColor={BUNDLE_ACCENT}
                strokeWidth={1.5}
                lineDashPattern={[4, 4]}
                fillColor="rgba(124, 58, 237, 0.06)"
              />
              {subStops.map((sub, subIdx) => (
                <SubStopDot
                  key={`${stop.id}:${sub.id}`}
                  coords={dotCoords[subIdx]}
                  onPress={() =>
                    setSelectedSubStop({ sub, parentStopId: stop.id })
                  }
                />
              ))}
            </Fragment>
          )
        })}
        {phase === 'navigating' &&
          currentStop &&
          (currentStop.subStops && currentStop.subStops.length > 0 ? (
            <StopBundlePin
              key={currentStop.id}
              coords={currentStop.coords}
              count={currentStop.subStops.length}
              title={`${currentIndex + 1}. ${currentStop.name}`}
              description={currentStop.description}
            />
          ) : (
            <Marker
              key={currentStop.id}
              coordinate={currentStop.coords}
              title={`${currentIndex + 1}. ${currentStop.name}`}
              description={currentStop.description}
              pinColor={primary}
            />
          ))}

        {phase === 'navigating' && legPolylineParts.walked.length > 1 && (
          <Polyline
            coordinates={legPolylineParts.walked}
            strokeColor="rgba(110,110,110,0.85)"
            strokeWidth={5}
            zIndex={0}
          />
        )}
        {phase === 'navigating' && legPolylineParts.remaining.length > 1 && (
          <Polyline
            coordinates={legPolylineParts.remaining}
            strokeColor={primary}
            strokeWidth={5}
            zIndex={1}
          />
        )}
        {phase === 'preview' && stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s) => s.coords)}
            strokeColor={primary}
            strokeWidth={3}
            lineDashPattern={[8, 8]}
          />
        )}

        {/* Floating "Nearest" callout pinned above the closest stop. Only in
            preview — once the user starts, the chip is no longer relevant
            (currentStop becomes the focus). Rendered last in the preview
            block so it visually sits above the regular stop pins. */}
        {phase === 'preview' &&
          nearestStopIndex != null &&
          stops[nearestStopIndex] && (
            <NearestStopCallout coords={stops[nearestStopIndex].coords} />
          )}

        {/* POIs: hidden during navigation to declutter the map. They come
            back on arrival and preview so the user can still explore them. */}
        {phase !== 'navigating' &&
          pois.map((poi) => {
            const meta = POI_CATEGORY_META[poi.category]
            const Icon = meta.icon
            return (
              <Marker
                key={poi.id}
                coordinate={poi.coords}
                title={poi.name}
                onPress={() => setSelectedPoi(poi)}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <YStack
                  width={32}
                  height={32}
                  rounded={16}
                  bg="#FFFFFF"
                  borderWidth={2}
                  borderColor={meta.color as any}
                  items="center"
                  justify="center"
                  style={SHADOW.pin}
                >
                  <Icon size={16} color={meta.color as any} />
                </YStack>
              </Marker>
            )
          })}

        {/* Custom user pin with heading cone. Replaces the default blue
            dot. Rendered last so it always sits on top of polylines. */}
        {userLocation && !permissionDenied && (
          <UserHeadingPin
            coords={userLocation}
            heading={phase === 'navigating' ? heading : null}
          />
        )}
      </MapView>

      {phase === 'navigating' && (
        <Pressable
          onPress={recenter}
          style={{
            position: 'absolute',
            bottom: 16,
            right: H_PADDING,
            zIndex: 12,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW.card,
          }}
          hitSlop={8}
        >
          <LocateFixed size={22} color={primary as any} />
        </Pressable>
      )}
      </Animated.View>

      <BackButton topInset={topInset} onPress={goBack} />
      <HeaderTitle topInset={topInset} title={title} />
      <YStack
        position="absolute"
        t={topInset + 8}
        r={H_PADDING}
        z={10}
      >
        <FavoriteButton refToFavorite={{ type: 'excursion', id }} />
      </YStack>

      <FloatingFactBanner
        fact={factBanner.fact}
        factIndexInLeg={factBanner.factIndexInLeg}
        factsForThisLeg={factBanner.factsForThisLeg}
        visible={factBanner.visible}
        topOffset={topInset + 60}
        onPressFact={(f) => {
          setActiveFact(f)
          factBanner.dismiss()
          posthog?.capture('fact_played', {
            fact_id: f.id,
            excursion_id: id,
          })
        }}
        onDismiss={factBanner.dismiss}
      />

      <FloatingFactPlayer
        fact={activeFact}
        bottomAnim={bottomHeightAnim}
        onDismiss={() => setActiveFact(null)}
      />

      {waitingForGps && <WaitingForGpsToast topInset={topInset} />}

      <Animated.View
        style={{ width: '100%', height: bottomHeightAnim, overflow: 'hidden' }}
      >
        <YStack flex={1}>
          <YStack
            items="center"
            justify="center"
            height={28}
            {...snapPanResponder.panHandlers}
          >
            <YStack width={56} height={5} rounded={3} bg="$borderColor" />
          </YStack>
          <YStack flex={1}>
            <StopsList
              stops={stops}
              pois={pois}
              currentIndex={currentIndex}
              phase={phase}
              onPoiPress={setSelectedPoi}
              onStopPress={(stop) => setLightboxUri(stop.image)}
              onSubStopPress={(sub) => setLightboxUri(sub.image)}
            />
          </YStack>
          <YStack
            onLayout={(e) =>
              setBottomPanelHeight(e.nativeEvent.layout.height)
            }
          >
            <BottomPanel
              phase={phase}
              excursionId={id}
              currentStop={currentStop}
              currentIndex={currentIndex}
              currentSubStopIndex={currentSubStopIndex}
              totalStops={stops.length}
              outro={outro}
              userLocation={userLocation}
              permissionDenied={permissionDenied}
              liveRouteInfo={liveRouteInfo}
              isOffRoute={isOffRoute}
              isFarFromRoute={isFarFromRoute}
              nearestStopMeters={nearestStopMeters}
              bottomInset={bottomInset}
              startFromStop={stops[startFromIndex]}
              startFromIndex={startFromIndex}
              isStartFromNearest={
                nearestStopIndex != null &&
                startFromIndex === nearestStopIndex
              }
              nearestStopName={
                nearestStopIndex != null
                  ? (stops[nearestStopIndex]?.name ?? null)
                  : null
              }
              nearestPillExpiresAt={nearestPillExpiresAt}
              onDismissNearestPill={() => setNearestPillExpiresAt(0)}
              onOpenStartFromPicker={() => setStartFromPickerOpen(true)}
              onStart={start}
              onContinue={continueNext}
              onSkip={skip}
              onAdvanceSubStop={advanceSubStop}
              onJumpToSubStop={jumpToSubStop}
              onSkipSubStop={skipSubStop}
              onRecalculate={recalculateRoute}
              onFinish={finish}
              onMoreInfo={() => {
                // On a bundle ArrivedPanel, More info should open whichever
                // panel is currently visible: parent sheet when subStopIndex
                // is -1 (parent intro), or the sub-stop's own sheet otherwise.
                // For non-bundle stops we always open the parent sheet.
                const subs = currentStop?.subStops
                const isBundle = !!subs && subs.length > 0
                if (
                  isBundle &&
                  currentSubStopIndex >= 0 &&
                  currentSubStopIndex < subs!.length &&
                  currentStop
                ) {
                  setSelectedSubStop({
                    sub: subs![currentSubStopIndex],
                    parentStopId: currentStop.id,
                  })
                } else {
                  setDetailSheetOpen(true)
                }
              }}
            />
          </YStack>
        </YStack>
      </Animated.View>

      {undoSkips.length > 0 && (
        <YStack
          position="absolute"
          // Anchor the deck to sit just above the BottomPanel. The container
          // has a small fixed height; pills inside are absolutely positioned
          // to overlap like a card deck — newest on top fully visible, older
          // ones peeking out behind.
          b={bottomPanelHeight + 8}
          l={H_PADDING}
          r={H_PADDING}
          height={100}
          z={12}
          pointerEvents="box-none"
        >
          {undoSkips.map((entry, idx) => {
            // depth = how far this pill is from the top of the stack.
            // 0 = newest (fully visible, in front). Larger = older (smaller
            // and offset up, peeking from behind). After 2 layers the
            // depth values still tick up so further pills compound the
            // offset slightly but lose visibility into the background.
            const depth = undoSkips.length - 1 - idx
            const offsetY = depth * 6
            const scale = Math.max(0.88, 1 - depth * 0.04)
            const opacity = Math.max(0.4, 1 - depth * 0.15)
            return (
              <YStack
                key={entry.skipKey}
                position="absolute"
                b={offsetY}
                l={0}
                r={0}
                z={100 - depth}
                style={{
                  transform: [{ scale }],
                  opacity,
                }}
                pointerEvents="box-none"
              >
                <UndoSkipPill
                  stopName={stops[entry.skippedIndex]?.name ?? ''}
                  expiresAt={entry.expiresAt}
                  onPress={() => undoSkipByKey(entry.skipKey)}
                />
              </YStack>
            )
          })}
        </YStack>
      )}

      <StopDetailSheet
        visible={detailSheetOpen}
        stop={currentStop ?? null}
        onClose={() => setDetailSheetOpen(false)}
      />

      <PoiDetailSheet
        visible={!!selectedPoi}
        poi={selectedPoi}
        onClose={() => setSelectedPoi(null)}
      />

      <SubStopDetailSheet
        visible={!!selectedSubStop}
        sub={selectedSubStop?.sub ?? null}
        excursionId={id}
        stopId={selectedSubStop?.parentStopId ?? ''}
        onClose={() => setSelectedSubStop(null)}
      />

      <StartFromPicker
        visible={startFromPickerOpen}
        stops={stops}
        selectedIndex={startFromIndex}
        nearestIndex={nearestStopIndex}
        onSelect={pickStartFrom}
        onClose={() => setStartFromPickerOpen(false)}
      />

      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />

      {permissionDenied && <LocationDeniedOverlay onGoBack={goBack} />}

      <RatingPromptSheet
        visible={ratingPrompt.visible}
        onClose={ratingPrompt.close}
        targetType="excursion"
        targetId={id}
        entityName={title}
      />
    </YStack>
  )
}

function WaitingForGpsToast({ topInset }: { topInset: number }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const iconColor = theme.color1?.val ?? '#FFFFFF'
  return (
    <YStack
      position="absolute"
      t={topInset + 60}
      l={0}
      r={0}
      z={11}
      items="center"
      pointerEvents="none"
    >
      <XStack
        bg="$color12"
        rounded="$6"
        px="$3.5"
        py="$2"
        gap="$2.5"
        items="center"
        style={SHADOW.pillFloating}
      >
        <LocateFixed size={14} color={iconColor as any} />
        <SizableText
          size="$2"
          color="$color1"
          fontFamily="$body"
          fontWeight="600"
        >
          {t('excursion.waitingForGps', {
            defaultValue: 'Waiting for location…',
          })}
        </SizableText>
      </XStack>
    </YStack>
  )
}

function LocationDeniedOverlay({ onGoBack }: { onGoBack: () => void }) {
  const { t } = useTranslation()
  return (
    <YStack
      position="absolute"
      t={0}
      l={0}
      r={0}
      b={0}
      bg="rgba(0,0,0,0.55)"
      items="center"
      justify="center"
      px="$5"
      z={50}
    >
      <YStack
        bg="$surface"
        rounded="$6"
        p="$5"
        gap="$3"
        items="center"
        style={{
          // Cap width so it doesn't stretch on tablets, but let the parent
          // padding (px="$5" on outer overlay) determine the width on
          // narrow phones — otherwise the card can end up wider than the
          // viewport-minus-padding on SE-class devices.
          width: '100%',
          maxWidth: 360,
          ...SHADOW.modal,
        }}
      >
        <YStack
          width={56}
          height={56}
          rounded={28}
          bg="$surfaceMuted"
          items="center"
          justify="center"
        >
          <MapPinOff size={28} color="$primary" />
        </YStack>
        <SizableText
          size="$5"
          fontWeight="700"
          fontFamily="$body"
          color="$color"
          text="center"
        >
          {t('excursion.locationDenied.title', {
            defaultValue: 'Location is required',
          })}
        </SizableText>
        <SizableText
          size="$2"
          color="$colorPress"
          fontFamily="$body"
          text="center"
          style={{ lineHeight: 18 }}
        >
          {t('excursion.locationDenied.body', {
            defaultValue:
              'This excursion needs your location to guide you between stops. Enable it in Settings to continue.',
          })}
        </SizableText>
        <Pressable
          onPress={() => Linking.openSettings()}
          hitSlop={6}
          style={{ marginTop: 4, width: '100%' }}
        >
          <YStack
            bg="$primary"
            rounded="$5"
            py="$2.5"
            px="$5"
            items="center"
            justify="center"
          >
            <SizableText
              size="$3"
              color="$colorOnBrand"
              fontFamily="$body"
              fontWeight="700"
            >
              {t('excursion.locationDenied.cta', {
                defaultValue: 'Open Settings',
              })}
            </SizableText>
          </YStack>
        </Pressable>
        <Pressable
          onPress={onGoBack}
          hitSlop={6}
          style={{ width: '100%' }}
        >
          <YStack py="$2" items="center" justify="center">
            <SizableText
              size="$3"
              color="$colorPress"
              fontFamily="$body"
              fontWeight="600"
            >
              {t('excursion.locationDenied.goBack', {
                defaultValue: 'Go back',
              })}
            </SizableText>
          </YStack>
        </Pressable>
      </YStack>
    </YStack>
  )
}

function UndoSkipPill({
  stopName,
  expiresAt,
  onPress,
}: {
  stopName: string
  expiresAt: number
  onPress: () => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  // $color1 is the inverse-contrast step — light in dark theme, dark in light
  // theme — so it pairs with $color12 backgrounds for icons and translucent
  // overlays that need to read as "the foreground tint."
  const fg = theme.color1?.val ?? '#FFFFFF'
  // Countdown bar: animate width from 1 → 0 over the remaining lifetime of
  // this pill. The bar makes it obvious the pill is dismiss-on-timeout and
  // shows how much time is left to tap. Driven by Animated so the timing is
  // independent of React re-renders.
  const progressAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const remaining = Math.max(0, expiresAt - Date.now())
    progressAnim.setValue(1)
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: remaining,
      useNativeDriver: false,
    }).start()
  }, [expiresAt, progressAnim])
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <YStack
        bg="$color12"
        rounded="$6"
        style={{
          overflow: 'hidden',
          ...SHADOW.pillFloating,
        }}
      >
        <XStack items="center" gap="$2.5" px="$3" py="$2.5">
          <YStack
            width={28}
            height={28}
            rounded={14}
            items="center"
            justify="center"
            bg="$color11"
          >
            <Undo2 size={16} color={fg as any} />
          </YStack>
          <YStack flex={1}>
            <SizableText
              size="$1"
              color="$color1"
              fontFamily="$body"
              fontWeight="700"
              style={{
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                opacity: 0.75,
              }}
            >
              {t('excursion.undoSkip.title', { defaultValue: 'Tap to undo skip' })}
            </SizableText>
            <SizableText
              size="$3"
              color="$color1"
              fontFamily="$body"
              fontWeight="600"
              numberOfLines={1}
            >
              {stopName}
            </SizableText>
          </YStack>
        </XStack>
        <Animated.View
          style={{
            height: 3,
            width: progressWidth,
            backgroundColor: fg,
            opacity: 0.65,
          }}
        />
      </YStack>
    </Pressable>
  )
}

function BottomPanel({
  phase,
  excursionId,
  currentStop,
  currentIndex,
  currentSubStopIndex,
  totalStops,
  outro,
  userLocation,
  liveRouteInfo,
  isOffRoute,
  isFarFromRoute,
  nearestStopMeters,
  bottomInset,
  startFromStop,
  startFromIndex,
  isStartFromNearest,
  nearestStopName,
  nearestPillExpiresAt,
  onDismissNearestPill,
  onOpenStartFromPicker,
  onStart,
  onContinue,
  onSkip,
  onAdvanceSubStop,
  onJumpToSubStop,
  onSkipSubStop,
  onRecalculate,
  onFinish,
  onMoreInfo,
}: {
  phase: Phase
  excursionId: string
  currentStop?: ExcursionStop
  currentIndex: number
  currentSubStopIndex: number
  totalStops: number
  outro?: PublicExcursionOutro
  userLocation: LatLng | null
  permissionDenied: boolean
  liveRouteInfo: { remainingMeters: number; remainingSeconds: number } | null
  isOffRoute: boolean
  isFarFromRoute: boolean
  nearestStopMeters: number | null
  bottomInset: number
  startFromStop?: ExcursionStop
  startFromIndex: number
  isStartFromNearest: boolean
  nearestStopName: string | null
  nearestPillExpiresAt: number
  onDismissNearestPill: () => void
  onOpenStartFromPicker: () => void
  onStart: () => void
  onContinue: () => void
  onSkip: () => void
  onAdvanceSubStop: () => void
  onJumpToSubStop: (target: number) => void
  onSkipSubStop: () => void
  onRecalculate: () => void
  onFinish: () => void
  onMoreInfo: () => void
}) {
  return (
    <YStack
      bg="$surface"
      borderTopWidth={1}
      borderColor="$borderColor"
      px={H_PADDING}
      pt="$4"
      pb={Math.max(bottomInset, 16)}
      gap="$3"
      style={SHADOW.liftUp}
    >
      {phase === 'preview' && isFarFromRoute && (
        <FarFromRouteWarning
          meters={nearestStopMeters ?? 0}
          onStartAnyway={onStart}
        />
      )}
      {phase === 'preview' && !isFarFromRoute && (
        <PreviewPanel
          total={totalStops}
          onStart={onStart}
          startFromStop={startFromStop}
          startFromIndex={startFromIndex}
          isStartFromNearest={isStartFromNearest}
          nearestStopName={nearestStopName}
          nearestPillExpiresAt={nearestPillExpiresAt}
          onDismissNearestPill={onDismissNearestPill}
          onOpenStartFromPicker={onOpenStartFromPicker}
        />
      )}

      {phase === 'navigating' && currentStop && (
        <NavigatingPanel
          stop={currentStop}
          index={currentIndex}
          total={totalStops}
          userLocation={userLocation}
          liveRouteInfo={liveRouteInfo}
          isOffRoute={isOffRoute}
          onSkip={onSkip}
          onRecalculate={onRecalculate}
        />
      )}

      {phase === 'arrived' && currentStop && (
        <ArrivedPanel
          stop={currentStop}
          index={currentIndex}
          total={totalStops}
          subStopIndex={currentSubStopIndex}
          onContinue={onContinue}
          onAdvanceSubStop={onAdvanceSubStop}
          onJumpToSubStop={onJumpToSubStop}
          onSkipSubStop={onSkipSubStop}
          onSkipBundle={onSkip}
          onMoreInfo={onMoreInfo}
        />
      )}

      {phase === 'outro' && outro && (
        <OutroPanel outro={outro} excursionId={excursionId} onFinish={onFinish} />
      )}

      {phase === 'complete' && (
        <CompletePanel total={totalStops} onFinish={onFinish} />
      )}
    </YStack>
  )
}

function FarFromRouteWarning({
  meters,
  onStartAnyway,
}: {
  meters: number
  onStartAnyway: () => void
}) {
  const { t } = useTranslation()
  const km = (meters / 1000).toFixed(meters < 10000 ? 1 : 0)
  return (
    <YStack gap="$2">
      <XStack items="center" gap="$2.5">
        <YStack
          width={36}
          height={36}
          rounded={18}
          bg="$surfaceMuted"
          items="center"
          justify="center"
        >
          <MapPinOff size={18} color="$primary" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <SizableText
            size="$4"
            color="$color"
            fontFamily="$body"
            fontWeight="700"
          >
            {t('excursion.farFromRoute.title', {
              defaultValue: "You're far from this excursion",
            })}
          </SizableText>
          <SizableText size="$2" color="$colorPress" fontFamily="$body">
            {t('excursion.farFromRoute.body', {
              km,
              defaultValue: `Nearest stop is about ${km} km away.`,
            })}
          </SizableText>
        </YStack>
      </XStack>
      <Pressable onPress={onStartAnyway} hitSlop={6}>
        <YStack
          py="$2.5"
          rounded="$5"
          bg="$surfaceMuted"
          borderWidth={1}
          borderColor="$borderColor"
          items="center"
          justify="center"
        >
          <SizableText
            size="$3"
            color="$colorPress"
            fontFamily="$body"
            fontWeight="600"
          >
            {t('excursion.farFromRoute.startAnyway', {
              defaultValue: 'Start anyway',
            })}
          </SizableText>
        </YStack>
      </Pressable>
    </YStack>
  )
}

function PreviewPanel({
  total,
  onStart,
  startFromStop,
  startFromIndex,
  isStartFromNearest,
  nearestStopName,
  nearestPillExpiresAt,
  onDismissNearestPill,
  onOpenStartFromPicker,
}: {
  total: number
  onStart: () => void
  // When provided, the "Starting from" chip is shown above the Start button.
  // Omitted means the excursion has zero stops (which shouldn't happen in
  // practice but keeps the prop optional for safety).
  startFromStop?: ExcursionStop
  startFromIndex: number
  isStartFromNearest: boolean
  // Name of the GPS-derived nearest stop; null until GPS resolves.
  nearestStopName: string | null
  // Timestamp at which the one-shot nearest-stop pill should be gone.
  // 0 means "not visible". The pill renders its own countdown bar off
  // this value so the user sees how long until it auto-dismisses.
  nearestPillExpiresAt: number
  onDismissNearestPill: () => void
  onOpenStartFromPicker: () => void
}) {
  const { t } = useTranslation()
  const pillVisible = nearestPillExpiresAt > Date.now()
  // Ported to PhaseCard shape (Session 1 of the ExcursionScreen redesign).
  // Same content as before, just wrapped in the shared header / body /
  // actions layout so every phase's card reads structurally the same.
  return (
    <PhaseCard>
      <PhaseCardHeader
        accent="preview"
        badge={t('excursion.preview.badge', {
          count: total,
          defaultValue: `Ready · ${total} stops`,
        })}
        title={t('excursion.preview.title')}
      />
      <PhaseCardBody>
        <Paragraph color="$colorPress" fontFamily="$body" size="$3">
          {t('excursion.preview.subtitle', { count: total })}
        </Paragraph>
        {pillVisible && nearestStopName && (
          <NearestStopInlinePill
            stopName={nearestStopName}
            expiresAt={nearestPillExpiresAt}
            onPress={onDismissNearestPill}
          />
        )}
        {startFromStop && (
          <StartFromChip
            stop={startFromStop}
            index={startFromIndex}
            isNearest={isStartFromNearest}
            onPress={onOpenStartFromPicker}
          />
        )}
      </PhaseCardBody>
      <PhaseCardActions
        primary={{
          label: t('excursion.preview.start'),
          onPress: onStart,
          icon: <Play size={18} color="$colorOnBrand" />,
        }}
      />
    </PhaseCard>
  )
}

// Inline informational pill rendered above the Start From chip during
// preview. Mirrors the visual shape of the off-route warning in the
// NavigatingPanel (small icon circle on the left, title + subtitle stacked
// on the right) but styled with the amber brand pair so it reads as a
// "nearest-stop suggestion" rather than a route-error warning. Includes a
// thin amber progress bar at the bottom that drains from 100% → 0% over
// the pill's lifetime so the user can see it's about to auto-dismiss.
// Pattern reused from UndoSkipPill — same Animated.timing on a width
// interpolation, driven by the parent-owned expiresAt timestamp.
function NearestStopInlinePill({
  stopName,
  expiresAt,
  onPress,
}: {
  stopName: string
  expiresAt: number
  onPress: () => void
}) {
  const { t } = useTranslation()
  const progressAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const remaining = Math.max(0, expiresAt - Date.now())
    progressAnim.setValue(1)
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: remaining,
      useNativeDriver: false,
    }).start()
  }, [expiresAt, progressAnim])
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <YStack
        rounded="$4"
        borderWidth={1}
        // Amber border + soft amber wash mirrors the picker's nearest row,
        // so the user reads "this is the same info, surfaced here too".
        // RGBA fallback because there's no $accentSoft token; amber stays
        // amber in both themes anyway.
        style={{
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          overflow: 'hidden',
          ...SHADOW.subtle,
        }}
      >
        <XStack items="center" gap="$2.5" px="$3" py="$2">
          <YStack
            width={24}
            height={24}
            rounded={12}
            items="center"
            justify="center"
            bg="$accent"
          >
            <MapPin size={12} color={palette.navy as any} />
          </YStack>
          <YStack flex={1}>
            <SizableText
              size="$1"
              color="$colorPress"
              fontFamily="$body"
              fontWeight="700"
              style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              {t('excursion.startFrom.nearestBadge', {
                defaultValue: 'Nearest',
              })}
            </SizableText>
            <SizableText
              size="$3"
              color="$color"
              fontFamily="$body"
              fontWeight="600"
              numberOfLines={1}
            >
              {t('excursion.startFrom.nearestToast', {
                stopName,
                defaultValue: `${stopName} is closest to you`,
              })}
            </SizableText>
          </YStack>
        </XStack>
        {/* Countdown bar — drains left-to-right as the auto-dismiss timer
            elapses. Same pattern as UndoSkipPill so the visual language of
            "ephemeral, will go away soon" is consistent across the app. */}
        <Animated.View
          style={{
            height: 3,
            width: progressWidth,
            backgroundColor: '#F59E0B',
          }}
        />
      </YStack>
    </Pressable>
  )
}

// "Starting from: 5. Octagon ▾" — tappable chip that opens the picker.
// Renders a small "Nearest" badge when the current pick matches the GPS-
// derived nearest stop, so users understand what the default reflects.
function StartFromChip({
  stop,
  index,
  isNearest,
  onPress,
}: {
  stop: ExcursionStop
  index: number
  isNearest: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <XStack
        items="center"
        gap="$2.5"
        px="$3"
        py="$2"
        rounded="$5"
        bg="$surfaceMuted"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack
          width={28}
          height={28}
          rounded={14}
          bg="$primary"
          items="center"
          justify="center"
        >
          <SizableText
            size="$1"
            color="$colorOnBrand"
            fontFamily="$body"
            fontWeight="800"
          >
            {index + 1}
          </SizableText>
        </YStack>
        {/* minWidth: 0 lets numberOfLines={1} on the name actually clip long
            stop names — without it, flex:1 alone lets the child overflow the
            parent and pushes the "Nearest" badge + chevron off-screen. */}
        <YStack flex={1} gap="$0.5" style={{ minWidth: 0 }}>
          <SizableText
            size="$1"
            color="$colorPress"
            fontFamily="$body"
            fontWeight="700"
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {t('excursion.startFrom.label', { defaultValue: 'Starting from' })}
          </SizableText>
          <SizableText
            size="$3"
            color="$color"
            fontFamily="$body"
            fontWeight="600"
            numberOfLines={1}
          >
            {stop.name}
          </SizableText>
        </YStack>
        {isNearest && (
          <YStack
            px="$2"
            py="$0.5"
            rounded="$2"
            bg="$primary"
          >
            <SizableText
              size="$1"
              color="$colorOnBrand"
              fontFamily="$body"
              fontWeight="800"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {t('excursion.startFrom.nearestBadge', {
                defaultValue: 'Nearest',
              })}
            </SizableText>
          </YStack>
        )}
        <ChevronDown size={18} color="$colorPress" />
      </XStack>
    </Pressable>
  )
}

function NavigatingPanel({
  stop,
  index,
  total,
  userLocation,
  liveRouteInfo,
  isOffRoute,
  onSkip,
  onRecalculate,
}: {
  stop: ExcursionStop
  index: number
  total: number
  userLocation: LatLng | null
  liveRouteInfo: { remainingMeters: number; remainingSeconds: number } | null
  isOffRoute: boolean
  onSkip: () => void
  onRecalculate: () => void
}) {
  const { t } = useTranslation()
  const straightLineMeters = userLocation
    ? haversineMeters(userLocation, stop.coords)
    : null
  const displayMeters = liveRouteInfo?.remainingMeters ?? straightLineMeters
  // When the user is wildly far from the current stop the route distance
  // would read like "127 km · 14h 12m" — useless and confusing. Above this
  // threshold we hide the numbers entirely and just say "Far from stop".
  // Uses straight-line haversine so it works even if the route metadata
  // hasn't arrived yet.
  const FAR_FROM_STOP_METERS = 3000
  const isFarFromStop =
    straightLineMeters != null && straightLineMeters > FAR_FROM_STOP_METERS
  const isLast = index + 1 === total
  const distanceLine = isFarFromStop
    ? t('excursion.farFromStop', { defaultValue: 'Far from stop' })
    : `${formatDistance(displayMeters)}${
        liveRouteInfo
          ? ` · ${formatDuration(liveRouteInfo.remainingSeconds)}`
          : ''
      }`
  // Nav-icon thumb rendered inline as the header accessory so it visually
  // pairs with the badge + title. Same 40dp circle the old layout used.
  const navThumb = (
    <YStack
      width={40}
      height={40}
      rounded={20}
      bg="$primary"
      items="center"
      justify="center"
    >
      <Navigation size={20} color="$colorOnBrand" />
    </YStack>
  )
  return (
    <PhaseCard>
      <PhaseCardHeader
        accent="navigating"
        badge={t('excursion.navigating.stopOf', { index: index + 1, total })}
        title={stop.name}
        accessory={navThumb}
      />
      <PhaseCardBody>
        {isOffRoute && (
          // Off-route warning — same visual as before but sits inside the
          // body slot instead of above the header, matching the "body is
          // where phase-specific state lives" pattern.
          <Pressable onPress={onRecalculate} hitSlop={6}>
            <XStack
              items="center"
              gap="$2.5"
              px="$3"
              py="$2"
              rounded="$4"
              borderWidth={1}
              borderColor="$primary"
              bg="$surfaceMuted"
              style={SHADOW.subtle}
            >
              <YStack
                width={24}
                height={24}
                rounded={12}
                items="center"
                justify="center"
                bg="$primary"
              >
                <Navigation size={12} color="$colorOnBrand" />
              </YStack>
              <YStack flex={1}>
                <SizableText
                  size="$3"
                  color="$color"
                  fontFamily="$body"
                  fontWeight="600"
                >
                  {t('excursion.offRoute.title', {
                    defaultValue: "You're off the route",
                  })}
                </SizableText>
                <SizableText size="$2" color="$colorPress" fontFamily="$body">
                  {t('excursion.offRoute.cta', {
                    defaultValue: 'Tap to recalculate',
                  })}
                </SizableText>
              </YStack>
            </XStack>
          </Pressable>
        )}
        <SizableText
          size="$3"
          color="$colorPress"
          fontFamily="$body"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {distanceLine}
        </SizableText>
      </PhaseCardBody>
      <PhaseCardActions
        primary={{
          label: isLast ? t('excursion.arrived.finish') : t('common.skip'),
          onPress: onSkip,
        }}
      />
    </PhaseCard>
  )
}

function ArrivedPanel({
  stop,
  index,
  total,
  subStopIndex,
  onContinue,
  onAdvanceSubStop,
  onJumpToSubStop,
  onSkipSubStop,
  onSkipBundle,
  onMoreInfo,
}: {
  stop: ExcursionStop
  index: number
  total: number
  subStopIndex: number
  onContinue: () => void
  onAdvanceSubStop: () => void
  onJumpToSubStop: (target: number) => void
  onSkipSubStop: () => void
  onSkipBundle: () => void
  onMoreInfo: () => void
}) {
  const { t } = useTranslation()
  const isLast = index + 1 === total
  const subStops = stop.subStops ?? []
  const isBundle = subStops.length > 0

  // Track which sub-stop slots the user has already visited so the pager
  // can distinguish "you've been here" from "you haven't opened this yet".
  // Session-scoped — resets whenever we leave this bundle (currentStop
  // change unmounts ArrivedPanel). -1 (intro) is added on mount so the
  // intro chip always reads as visited once you see the panel.
  const [visited, setVisited] = useState<Set<number>>(
    () => new Set<number>([-1]),
  )
  useEffect(() => {
    if (!isBundle) return
    setVisited((prev) => {
      if (prev.has(subStopIndex)) return prev
      const next = new Set(prev)
      next.add(subStopIndex)
      return next
    })
  }, [subStopIndex, isBundle])

  if (isBundle) {
    // -1 = parent intro slot; 0..N-1 = sub-stops.
    const onParent = subStopIndex < 0
    const sub = onParent ? null : (subStops[subStopIndex] ?? subStops[0])
    const isLastSubStop = !onParent && subStopIndex + 1 >= subStops.length
    const displayImage = onParent ? stop.image : sub!.image
    const displayName = onParent ? stop.name : sub!.name
    const displayDescription = onParent ? stop.description : sub!.description
    // Badge summarises "where in the bundle am I?" — two variants so the
    // parent intro reads as an overview and each sub-stop reads as a
    // position. Copy is kept short so the header row breathes.
    const badge = onParent
      ? t('excursion.arrived.bundleIntroBadge', {
          count: subStops.length,
          defaultValue: `Bundle · ${subStops.length} stops`,
        })
      : t('excursion.arrived.bundlePositionBadge', {
          index: subStopIndex + 1,
          total: subStops.length,
          defaultValue: `Bundle · ${subStopIndex + 1} of ${subStops.length}`,
        })
    // Bundle thumb — 56dp same as non-bundle, but the source image swaps
    // to reflect the current sub-stop when one is selected.
    const bundleThumb = (
      <Image
        source={{ uri: displayImage }}
        style={{ width: 56, height: 56, borderRadius: 12 }}
        resizeMode="cover"
      />
    )
    // Primary action label + handler both depend on where in the bundle
    // we are. Parent slot starts the walk-through; last sub-stop exits;
    // any middle sub-stop advances to the next.
    const primaryLabel = onParent
      ? t('excursion.arrived.startStops', {
          count: subStops.length,
          defaultValue: `Start ${subStops.length} stops`,
        })
      : isLastSubStop
        ? isLast
          ? t('excursion.arrived.finish')
          : t('excursion.arrived.continue')
        : t('excursion.arrived.next', { defaultValue: 'Next' })
    const primaryOnPress = onParent
      ? onAdvanceSubStop
      : isLastSubStop
        ? onContinue
        : onAdvanceSubStop
    const primaryIcon =
      isLastSubStop && isLast ? (
        <MapPin size={18} color="$colorOnBrand" />
      ) : (
        <Navigation size={18} color="$colorOnBrand" />
      )
    return (
      <PhaseCard>
        <PhaseCardHeader
          accent="bundle"
          badge={badge}
          title={displayName}
          accessory={bundleThumb}
        />
        <PhaseCardBody>
          <SubStopPager
            count={subStops.length}
            current={subStopIndex}
            visited={visited}
            onJump={onJumpToSubStop}
          />
          <Paragraph
            color="$color"
            fontFamily="$body"
            size="$3"
            lineHeight="$3"
            numberOfLines={3}
          >
            {displayDescription}
          </Paragraph>
        </PhaseCardBody>
        <PhaseCardActions
          secondary={{
            label: t('excursion.arrived.moreInfo'),
            onPress: onMoreInfo,
          }}
          primary={{
            label: primaryLabel,
            onPress: primaryOnPress,
            icon: primaryIcon,
          }}
          tertiary={
            !onParent
              ? {
                  label: t('excursion.arrived.skipSubStop', {
                    name: sub!.name,
                    defaultValue: `Skip ${sub!.name}`,
                  }),
                  onPress: onSkipSubStop,
                }
              : {
                  label: t('excursion.arrived.skipBundle', {
                    bundle: stop.name,
                    defaultValue: `Skip all spots at ${stop.name}`,
                  }),
                  onPress: onSkipBundle,
                }
          }
        />
      </PhaseCard>
    )
  }

  // Non-bundle arrival — ported to PhaseCard (Session 2 of the redesign).
  // The 56dp square image thumbnail becomes the header accessory; the
  // "ARRIVED · N OF M" label becomes the badge. Description sits in the
  // body slot; the two-button row collapses to actions: More info as the
  // secondary link, Continue/Finish as the primary CTA.
  const stopThumb = (
    <Image
      source={{ uri: stop.image }}
      style={{ width: 56, height: 56, borderRadius: 12 }}
      resizeMode="cover"
    />
  )
  return (
    <PhaseCard>
      <PhaseCardHeader
        accent="arrived"
        badge={t('excursion.arrived.arrivedLabel', {
          index: index + 1,
          total,
        })}
        title={stop.name}
        accessory={stopThumb}
      />
      <PhaseCardBody>
        <Paragraph
          color="$color"
          fontFamily="$body"
          size="$3"
          lineHeight="$3"
          numberOfLines={3}
        >
          {stop.description}
        </Paragraph>
      </PhaseCardBody>
      <PhaseCardActions
        secondary={{
          label: t('excursion.arrived.moreInfo'),
          onPress: onMoreInfo,
        }}
        primary={{
          label: isLast
            ? t('excursion.arrived.finish')
            : t('excursion.arrived.continue'),
          onPress: onContinue,
          icon: isLast ? (
            <MapPin size={18} color="$colorOnBrand" />
          ) : (
            <Navigation size={18} color="$colorOnBrand" />
          ),
        }}
      />
    </PhaseCard>
  )
}

// Sign-off card shown after the last stop, before the final 'complete'
// screen. Editor-authored: image, title, optional audio, long description.
// Single 'Finish' button transitions out (callers map this to the existing
// finish behavior — exiting the excursion screen).
function OutroPanel({
  outro,
  excursionId,
  onFinish,
}: {
  outro: PublicExcursionOutro
  excursionId: string
  onFinish: () => void
}) {
  const { t } = useTranslation()
  // Outro card — coral phase tint. Hero image sits in the body as a full-
  // width banner (this phase intentionally leans on the image as the
  // emotional close); audio + description below it. Same PhaseCard shape
  // as the other panels so the sign-off doesn't feel structurally
  // orphaned. See ExcursionScreen redesign notes.
  return (
    <PhaseCard>
      <PhaseCardHeader
        accent="outro"
        badge={t('excursion.outro.badge', { defaultValue: 'Wrap-up' })}
        title={outro.title}
      />
      <PhaseCardBody>
        <Image
          source={{ uri: outro.image }}
          style={{ width: '100%', height: 160, borderRadius: 12 }}
          resizeMode="cover"
        />
        <AudioPlayer
          audioUrl={outro.audioUrl}
          title={t('excursion.stopSheet.audioTitle')}
          analyticsSourceType="outro"
          analyticsSourceId={excursionId}
        />
        <Paragraph
          color="$color"
          fontFamily="$body"
          size="$3"
          lineHeight="$5"
        >
          {outro.description}
        </Paragraph>
      </PhaseCardBody>
      <PhaseCardActions
        primary={{
          label: t('excursion.outro.finish', { defaultValue: 'Finish' }),
          onPress: onFinish,
          icon: <MapPin size={18} color="$colorOnBrand" />,
        }}
      />
    </PhaseCard>
  )
}

function CompletePanel({
  total,
  onFinish,
}: {
  total: number
  onFinish: () => void
}) {
  const { t } = useTranslation()
  // Complete card — success-green phase tint. Deliberately spare: just a
  // congratulatory badge, the title, the body copy, and Done. The rating
  // prompt sheet fires 1.2s after this phase (see phase effect above) so
  // we don't add a rating affordance here.
  return (
    <PhaseCard>
      <PhaseCardHeader
        accent="complete"
        badge={t('excursion.complete.badge', { defaultValue: 'Completed' })}
        title={t('excursion.complete.title')}
      />
      <PhaseCardBody>
        <Paragraph color="$colorPress" fontFamily="$body" size="$3">
          {t('excursion.complete.body', { count: total })}
        </Paragraph>
      </PhaseCardBody>
      <PhaseCardActions
        primary={{
          label: t('excursion.complete.done'),
          onPress: onFinish,
          icon: <MapPin size={18} color="$colorOnBrand" />,
        }}
      />
    </PhaseCard>
  )
}


function HeaderTitle({ topInset, title }: { topInset: number; title: string }) {
  return (
    <YStack
      position="absolute"
      t={topInset + 8}
      l={72}
      r={72}
      style={{ pointerEvents: 'none' }}
    >
      <YStack
        bg="$chromeOverlay"
        rounded={20}
        px="$3"
        py="$2"
        items="center"
      >
        <SizableText
          size="$3"
          color="$onMedia"
          fontFamily="$body"
          fontWeight="600"
          numberOfLines={1}
        >
          {title}
        </SizableText>
      </YStack>
    </YStack>
  )
}

function BackButton({
  topInset,
  onPress,
}: {
  topInset: number
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        position: 'absolute',
        top: topInset + 8,
        left: H_PADDING,
        zIndex: 10,
      }}
    >
      <YStack
        width={40}
        height={40}
        rounded={20}
        items="center"
        justify="center"
        bg="$chromeOverlay"
      >
        <ChevronLeft size={22} color="$onMedia" />
      </YStack>
    </Pressable>
  )
}

// Edge padding for fitToCoordinates, scaled to the current map height so a
// resized (snapped) bottom card doesn't cause the camera to over-zoom.
// fitToCoordinates subtracts padding from the available rect; if padding
// approaches the rect size, it ends up zooming WAY out to fit. Keeping
// padding proportional with hard min/max caps prevents that.
function makeEdgePadding(mapHeight: number): {
  top: number
  bottom: number
  left: number
  right: number
} {
  const top = Math.max(24, Math.min(80, mapHeight * 0.1))
  const bottom = Math.max(40, Math.min(180, mapHeight * 0.18))
  const side = 40
  return { top, bottom, left: side, right: side }
}

function formatDistance(meters: number | null): string {
  if (meters == null) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}
