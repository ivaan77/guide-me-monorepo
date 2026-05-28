import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Image,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import * as Location from 'expo-location'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { ChevronLeft, Info, MapPin, Navigation, Play } from '@tamagui/lucide-icons'
import type {
  PublicExcursionStop,
  PublicLatLng,
  PublicPoi,
} from '@guide-me-app/core'
import {
  H2,
  H3,
  Paragraph,
  SizableText,
  XStack,
  YStack,
  useTheme,
} from 'tamagui'
import { FavoriteButton } from '../../common/FavoriteButton'
import { useExcursion } from '../../hooks/useExcursion'
import {
  fetchWalkingRoute,
  haversineMeters,
  remainingMetersAlongPolyline,
  trimPolylineFromUser,
} from '../../lib/directions'
import { EmptyState } from '../discover/EmptyState'
import { POI_CATEGORY_META } from './poiCategory'
import { ExcursionSkeleton } from './ExcursionSkeleton'
import { PoiDetailSheet } from './PoiDetailSheet'
import { StopDetailSheet } from './StopDetailSheet'
import { StopsList } from './StopsList'

// Local aliases — the screen used these names heavily.
type ExcursionStop = PublicExcursionStop
type LatLng = PublicLatLng
type Poi = PublicPoi

type Props = {
  id: string
}

type Phase = 'preview' | 'navigating' | 'arrived' | 'complete'

const ARRIVAL_RADIUS_METERS = 30
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
  title: string
  topInset: number
  bottomInset: number
  mapRef: React.RefObject<MapView | null>
  goBack: () => void
  primary: string
}) {
  const [phase, setPhase] = useState<Phase>('preview')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([])
  const [routeMeta, setRouteMeta] = useState<{
    distanceMeters: number
    durationSeconds: number
  } | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null)

  const { height: screenHeight } = useWindowDimensions()
  const mapHeight = screenHeight * 0.5

  const currentStop = stops[currentIndex]

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null
    let cancelled = false

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setPermissionDenied(true)
        return
      }
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      if (cancelled) return
      setUserLocation({
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      })
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
        },
      )
    }

    start()
    return () => {
      cancelled = true
      sub?.remove()
    }
  }, [])

  useEffect(() => {
    if (phase !== 'navigating' || !userLocation || !currentStop) return
    const dist = haversineMeters(userLocation, currentStop.coords)
    if (dist <= ARRIVAL_RADIUS_METERS) {
      setPhase('arrived')
    }
  }, [phase, userLocation, currentStop])

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

  // Fit map to show all stops + POIs + user location when in preview.
  useEffect(() => {
    if (phase !== 'preview') return
    const coords: LatLng[] = [
      ...stops.map((s) => s.coords),
      ...pois.map((p) => p.coords),
    ]
    if (userLocation) coords.push(userLocation)
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
      animated: true,
    })
  }, [phase, stops, pois, userLocation, mapRef])

  const start = () => {
    setPhase('navigating')
    setCurrentIndex(0)
    setRoutePolyline([])
    setRouteMeta(null)
  }

  const continueNext = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= stops.length) {
      setPhase('complete')
      return
    }
    setCurrentIndex(nextIndex)
    setPhase('navigating')
    setRoutePolyline([])
    setRouteMeta(null)
  }

  const finish = () => goBack()

  // Live polyline anchored at the user's pin so the line shrinks as they walk.
  const displayPolyline = useMemo(() => {
    if (phase !== 'navigating' || !userLocation || routePolyline.length < 2) {
      return routePolyline
    }
    return trimPolylineFromUser(userLocation, routePolyline)
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

  return (
    <YStack flex={1} bg="$background">
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ width: '100%', height: mapHeight }}
        initialRegion={initialRegion}
        showsUserLocation={!permissionDenied}
        showsMyLocationButton={false}
      >
        {stops.map((stop, idx) => (
          <Marker
            key={stop.id}
            coordinate={stop.coords}
            title={`${idx + 1}. ${stop.name}`}
            description={stop.description}
            pinColor={
              phase === 'navigating' && idx === currentIndex
                ? primary
                : idx < currentIndex
                  ? '#9CA3AF'
                  : undefined
            }
          />
        ))}
        {phase === 'navigating' && displayPolyline.length > 1 && (
          <Polyline
            coordinates={displayPolyline}
            strokeColor={primary}
            strokeWidth={5}
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
        {pois.map((poi) => {
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
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 3,
                }}
              >
                <Icon size={16} color={meta.color as any} />
              </YStack>
            </Marker>
          )
        })}
      </MapView>

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

      <StopsList
        stops={stops}
        pois={pois}
        currentIndex={currentIndex}
        phase={phase}
        onPoiPress={setSelectedPoi}
      />

      <BottomPanel
        phase={phase}
        currentStop={currentStop}
        currentIndex={currentIndex}
        totalStops={stops.length}
        userLocation={userLocation}
        permissionDenied={permissionDenied}
        liveRouteInfo={liveRouteInfo}
        bottomInset={bottomInset}
        onStart={start}
        onContinue={continueNext}
        onSkip={continueNext}
        onFinish={finish}
        onMoreInfo={() => setDetailSheetOpen(true)}
      />

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
    </YStack>
  )
}

function BottomPanel({
  phase,
  currentStop,
  currentIndex,
  totalStops,
  userLocation,
  permissionDenied,
  liveRouteInfo,
  bottomInset,
  onStart,
  onContinue,
  onSkip,
  onFinish,
  onMoreInfo,
}: {
  phase: Phase
  currentStop?: ExcursionStop
  currentIndex: number
  totalStops: number
  userLocation: LatLng | null
  permissionDenied: boolean
  liveRouteInfo: { remainingMeters: number; remainingSeconds: number } | null
  bottomInset: number
  onStart: () => void
  onContinue: () => void
  onSkip: () => void
  onFinish: () => void
  onMoreInfo: () => void
}) {
  const { t } = useTranslation()
  return (
    <YStack
      bg="$surface"
      borderTopWidth={1}
      borderColor="$borderColor"
      px={H_PADDING}
      pt="$4"
      pb={Math.max(bottomInset, 16)}
      gap="$3"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      }}
    >
      {permissionDenied && (
        <SizableText size="$3" color="$colorPress" fontFamily="$body">
          {t('excursion.locationDenied')}
        </SizableText>
      )}

      {phase === 'preview' && (
        <PreviewPanel total={totalStops} onStart={onStart} />
      )}

      {phase === 'navigating' && currentStop && (
        <NavigatingPanel
          stop={currentStop}
          index={currentIndex}
          total={totalStops}
          userLocation={userLocation}
          liveRouteInfo={liveRouteInfo}
          onSkip={onSkip}
        />
      )}

      {phase === 'arrived' && currentStop && (
        <ArrivedPanel
          stop={currentStop}
          index={currentIndex}
          total={totalStops}
          onContinue={onContinue}
          onMoreInfo={onMoreInfo}
        />
      )}

      {phase === 'complete' && (
        <CompletePanel total={totalStops} onFinish={onFinish} />
      )}
    </YStack>
  )
}

function PreviewPanel({ total, onStart }: { total: number; onStart: () => void }) {
  const { t } = useTranslation()
  return (
    <YStack gap="$2">
      <H3 fontFamily="$body" fontWeight="700" color="$color">
        {t('excursion.preview.title')}
      </H3>
      <Paragraph color="$colorPress" fontFamily="$body" size="$3">
        {t('excursion.preview.subtitle', { count: total })}
      </Paragraph>
      <ActionButton
        label={t('excursion.preview.start')}
        icon={Play}
        onPress={onStart}
      />
    </YStack>
  )
}

function NavigatingPanel({
  stop,
  index,
  total,
  userLocation,
  liveRouteInfo,
  onSkip,
}: {
  stop: ExcursionStop
  index: number
  total: number
  userLocation: LatLng | null
  liveRouteInfo: { remainingMeters: number; remainingSeconds: number } | null
  onSkip: () => void
}) {
  const { t } = useTranslation()
  const straightLineMeters = userLocation
    ? haversineMeters(userLocation, stop.coords)
    : null
  const displayMeters = liveRouteInfo?.remainingMeters ?? straightLineMeters
  return (
    <XStack items="center" gap="$3">
      <YStack
        width={40}
        height={40}
        rounded={20}
        bg="$primary"
        items="center"
        justify="center"
      >
        <Navigation size={20} color="$onBrand" />
      </YStack>
      <YStack flex={1} gap="$0.5">
        <SizableText
          size="$2"
          color="$colorPress"
          fontFamily="$body"
          fontWeight="600"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {t('excursion.navigating.stopOf', { index: index + 1, total })}
        </SizableText>
        <SizableText size="$5" color="$color" fontFamily="$body" fontWeight="600">
          {stop.name}
        </SizableText>
        <SizableText size="$2" color="$colorPress" fontFamily="$body">
          {formatDistance(displayMeters)}
          {liveRouteInfo
            ? ` · ${formatDuration(liveRouteInfo.remainingSeconds)}`
            : ''}
        </SizableText>
      </YStack>
      <Pressable onPress={onSkip} hitSlop={8}>
        <YStack
          px="$3"
          py="$2"
          rounded="$4"
          bg="$surfaceMuted"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <SizableText
            size="$2"
            color="$color"
            fontFamily="$body"
            fontWeight="600"
          >
            {index + 1 === total
              ? t('excursion.arrived.finish')
              : t('common.skip')}
          </SizableText>
        </YStack>
      </Pressable>
    </XStack>
  )
}

function ArrivedPanel({
  stop,
  index,
  total,
  onContinue,
  onMoreInfo,
}: {
  stop: ExcursionStop
  index: number
  total: number
  onContinue: () => void
  onMoreInfo: () => void
}) {
  const { t } = useTranslation()
  const isLast = index + 1 === total
  return (
    <YStack gap="$3">
      <XStack items="center" gap="$3">
        <Image
          source={{ uri: stop.image }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
          resizeMode="cover"
        />
        <YStack flex={1} gap="$0.5">
          <SizableText
            size="$2"
            color="$primary"
            fontFamily="$body"
            fontWeight="700"
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {t('excursion.arrived.arrivedLabel', { index: index + 1, total })}
          </SizableText>
          <SizableText size="$5" color="$color" fontFamily="$body" fontWeight="600">
            {stop.name}
          </SizableText>
        </YStack>
      </XStack>
      <Paragraph color="$color" fontFamily="$body" size="$3" lineHeight="$3" numberOfLines={3}>
        {stop.description}
      </Paragraph>
      <XStack gap="$2">
        <Pressable onPress={onMoreInfo} style={{ flex: 1 }}>
          <XStack
            flex={1}
            items="center"
            justify="center"
            gap="$2"
            bg="$surfaceMuted"
            borderWidth={1}
            borderColor="$borderColor"
            rounded="$5"
            py="$3.5"
            px="$4"
          >
            <Info size={18} color="$primary" />
            <SizableText
              size="$4"
              color="$color"
              fontFamily="$body"
              fontWeight="600"
            >
              {t('excursion.arrived.moreInfo')}
            </SizableText>
          </XStack>
        </Pressable>
        <YStack flex={1}>
          <ActionButton
            label={
              isLast
                ? t('excursion.arrived.finish')
                : t('excursion.arrived.continue')
            }
            icon={isLast ? MapPin : Navigation}
            onPress={onContinue}
          />
        </YStack>
      </XStack>
    </YStack>
  )
}

function CompletePanel({ total, onFinish }: { total: number; onFinish: () => void }) {
  const { t } = useTranslation()
  return (
    <YStack gap="$3">
      <H2 color="$color" fontFamily="$body" fontWeight="700" fontSize="$8">
        {t('excursion.complete.title')}
      </H2>
      <Paragraph color="$colorPress" fontFamily="$body" size="$3">
        {t('excursion.complete.body', { total })}
      </Paragraph>
      <ActionButton
        label={t('excursion.complete.done')}
        icon={MapPin}
        onPress={onFinish}
      />
    </YStack>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onPress,
}: {
  label: string
  icon: typeof Play
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        items="center"
        justify="center"
        gap="$2"
        bg="$primary"
        rounded="$5"
        py="$3.5"
        px="$4"
      >
        <Icon size={18} color="$onBrand" />
        <SizableText
          size="$4"
          color="$onBrand"
          fontFamily="$body"
          fontWeight="700"
        >
          {label}
        </SizableText>
      </XStack>
    </Pressable>
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
