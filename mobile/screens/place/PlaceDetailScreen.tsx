import { useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  type ViewToken,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { ChevronLeft } from '@tamagui/lucide-icons'
import type { PoiCategory, PublicPlaceDetail } from '@guide-me-app/core'
import { H1, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { AudioPlayer } from '../../common/AudioPlayer'
import { FavoriteButton } from '../../common/FavoriteButton'
import { usePlace } from '../../hooks/usePlace'
import { EmptyState } from '../discover/EmptyState'
import { CLEAN_MAP_STYLE } from '../excursion/cleanMapStyle'
import { PlaceDetailSkeleton } from './PlaceDetailSkeleton'

type Props = {
  id: string
}

const HERO_RATIO = 0.85
const H_PADDING = 20
const TAB_BAR_HEIGHT = 49

export function PlaceDetailScreen({ id }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: place, isPending, isError, refetch } = usePlace(id)

  const categoryLabel = (category: PoiCategory): string =>
    t(`place.category.${category}` as const)

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }

  if (isPending) {
    return (
      <YStack flex={1} bg="$background">
        <PlaceDetailSkeleton />
        <BackButton topInset={insets.top} onPress={goBack} />
      </YStack>
    )
  }

  if (isError || !place) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 56}>
        <BackButton topInset={insets.top} onPress={goBack} />
        <EmptyState
          variant="error"
          message={t('place.notFound')}
          onRetry={() => refetch()}
        />
      </YStack>
    )
  }

  const heroHeight = width * HERO_RATIO
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + 24

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <HeroCarousel
          place={place}
          width={width}
          heroHeight={heroHeight}
          categoryLabel={categoryLabel}
        />

        <YStack px={H_PADDING} pt="$5" gap="$3">
          <SizableText
            size="$2"
            color="$colorPress"
            fontFamily="$body"
            fontWeight="600"
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {place.meta}
          </SizableText>
          {place.audioUrl && (
            <AudioPlayer
              audioUrl={place.audioUrl}
              title={t('place.audioTitle')}
              promptKey="place.audioPrompt"
              playingKey="place.audioPlaying"
            />
          )}
          <Paragraph
            color="$color"
            fontFamily="$body"
            size="$4"
            lineHeight="$6"
          >
            {place.description ?? t('place.fallbackDescription')}
          </Paragraph>
          {place.coords && (
            <YStack
              mt="$2"
              rounded="$5"
              overflow="hidden"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <MapView
                // Google Maps on both platforms so customMapStyle applies
                // and the look matches the excursion screen.
                provider={PROVIDER_GOOGLE}
                style={{ width: '100%', height: 200 }}
                initialRegion={{
                  latitude: place.coords.latitude,
                  longitude: place.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                // Static preview only — disable everything that lets a tap
                // get swallowed instead of scrolling the page.
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                // Strip Google/Apple's own POI clutter so only our pin shows.
                customMapStyle={CLEAN_MAP_STYLE}
                showsPointsOfInterests={false}
                showsBuildings={false}
                showsTraffic={false}
                showsIndoors={false}
              >
                <Marker
                  coordinate={place.coords}
                  title={place.name}
                />
              </MapView>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <BackButton topInset={insets.top} onPress={goBack} />
      <YStack
        position="absolute"
        t={insets.top + 8}
        r={H_PADDING}
        z={10}
      >
        <FavoriteButton refToFavorite={{ type: 'place', id: place.id }} />
      </YStack>
    </YStack>
  )
}

function HeroCarousel({
  place,
  width,
  heroHeight,
  categoryLabel,
}: {
  place: PublicPlaceDetail
  width: number
  heroHeight: number
  categoryLabel: (c: PoiCategory) => string
}) {
  // Same carousel pattern as StopDetailSheet / PoiDetailSheet. Falls back to
  // [image] when no gallery so we always have at least one slide.
  const images = place.images?.length ? place.images : [place.image]
  const [carouselIndex, setCarouselIndex] = useState(0)

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]
      if (first?.index != null) setCarouselIndex(first.index)
    },
  ).current
  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 60 }),
    [],
  )

  return (
    <YStack width={width} height={heroHeight}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, idx) => `${uri}-${idx}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: heroHeight }}
            resizeMode="cover"
          />
        )}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        locations={[0, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: heroHeight * 0.55,
        }}
        pointerEvents="none"
      />
      {images.length > 1 && (
        <XStack
          position="absolute"
          // Sit at the bottom of the hero, matching StopDetailSheet /
          // PoiDetailSheet. The title block has its own padding above this.
          b="$3"
          l={0}
          r={0}
          items="center"
          justify="center"
          gap="$2"
          style={{ pointerEvents: 'none' }}
        >
          {images.map((_, idx) => (
            <YStack
              key={idx}
              width={idx === carouselIndex ? 18 : 6}
              height={6}
              rounded={3}
              bg={idx === carouselIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
          ))}
        </XStack>
      )}
      <YStack
        position="absolute"
        l={0}
        r={0}
        b={0}
        px={H_PADDING}
        pb="$5"
        gap="$1"
        // pointerEvents="none" lets the underlying FlatList still receive
        // swipes underneath the title overlay.
        pointerEvents="none"
      >
        <H1
          fontFamily="$heading"
          fontWeight="800"
          fontSize={44}
          lineHeight={48}
          color="$onMedia"
          numberOfLines={2}
          style={{ letterSpacing: -1 }}
        >
          {place.name}
        </H1>
        <SizableText
          size="$3"
          fontFamily="$body"
          color="$onMediaMuted"
          style={{ textTransform: 'uppercase', letterSpacing: 1 }}
          numberOfLines={1}
        >
          {categoryLabel(place.category)}
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
