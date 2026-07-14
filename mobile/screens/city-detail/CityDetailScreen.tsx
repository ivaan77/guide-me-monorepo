import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import {
  Baby,
  Brush,
  Cake,
  CalendarDays,
  ChevronLeft,
  Coffee,
  Compass,
  EggFried,
  Heart,
  Landmark,
  Mountain,
  PawPrint,
  ShoppingBag,
  Trees,
  Users,
  UtensilsCrossed,
  Wine,
} from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PublicCategoryItem } from '@guide-me-app/core'
import { H1, SizableText, XStack, YStack } from 'tamagui'
import { AudioPlayer } from '../../common/AudioPlayer'
import { FavoriteButton } from '../../common/FavoriteButton'
import { RatingPromptSheet } from '../../common/RatingPromptSheet'
import { RatingStars } from '../../common/RatingStars'
import { useCity } from '../../hooks/useCity'
import { useLayout } from '../../hooks/useLayout'
import { useDwellRatingPrompt } from '../../hooks/useRatingPrompt'
import { TABLET_MAX_CONTENT_WIDTH } from '../../constants/Sizes'
import { clearAuthChoice } from '../../providers/AuthChoice'

const LOGIN_HREF = '/login' as Href
import { EmptyState } from '../discover/EmptyState'
import { Accordion } from './Accordion'
import { CategoryListItem } from './CategoryListItem'
import { RelatedStories } from './RelatedStories'
import { WeatherBadge } from './WeatherBadge'
import { CityDetailSkeleton } from './CityDetailSkeleton'
import { EditorsPickBanner } from './EditorsPickBanner'

type Props = {
  id: string
}

const HERO_RATIO = 0.85
const H_PADDING = 20
const TAB_BAR_HEIGHT = 49

// User's coarse location for the "distance from me" sort inside category
// sections. We only need one fix — accuracy is Balanced, no watch. If the
// user denies permission we fall through to Editorial-only sort silently.
// Kept at screen level (not inside CategorySection) so all 14 sections
// share one fetch instead of 14 concurrent permission prompts.
type LatLng = { latitude: number; longitude: number }

function useCoarseUserLocation(): LatLng | null {
  const [loc, setLoc] = useState<LatLng | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync()
        // Only prompt if the user hasn't denied — CityDetail isn't a
        // navigation surface, so we don't push a permission dialog on
        // every open. If they've granted before, we can use it; if
        // they've denied, distance sort just stays unavailable.
        if (perm.status !== 'granted') return
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (!cancelled) {
          setLoc({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        }
      } catch {
        // Silent — distance sort just won't be available.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return loc
}

// Haversine distance between two lat/lng points in meters. Used only for
// sort comparisons — accuracy is more than enough for "order by proximity."
function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function CityDetailScreen({ id }: Props) {
  const { width: rawWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: city, isPending, isError, refetch } = useCity(id)
  const ratingPrompt = useDwellRatingPrompt('city', id, { enabled: !!city })
  const userLocation = useCoarseUserLocation()
  const { isTablet } = useLayout()
  // On tablets, cap the working content width so the hero image doesn't
  // stretch to 1024pt+ (unreadably large) and body text lines stay in the
  // 60-80 char comfort zone. `width` is the clamp used for downstream
  // sizing; `sideMargin` centers everything on the screen.
  const width = isTablet ? Math.min(rawWidth, TABLET_MAX_CONTENT_WIDTH) : rawWidth
  const sideMargin = isTablet
    ? Math.max(0, (rawWidth - TABLET_MAX_CONTENT_WIDTH) / 2)
    : 0

  const onTapRating = useCallback(async () => {
    if (ratingPrompt.isGuest) {
      await clearAuthChoice()
      router.push(LOGIN_HREF)
      return
    }
    ratingPrompt.openManual()
  }, [ratingPrompt, router])

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }

  if (isPending) {
    return (
      <YStack flex={1} bg="$background">
        <CityDetailSkeleton />
        <BackButton topInset={insets.top} onPress={goBack} />
      </YStack>
    )
  }

  if (isError || !city) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 56}>
        <BackButton topInset={insets.top} onPress={goBack} />
        <EmptyState
          variant="error"
          message={t('city.notFound')}
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
        contentContainerStyle={{
          paddingBottom: bottomPadding,
          paddingLeft: sideMargin,
          paddingRight: sideMargin,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack width={width} height={heroHeight}>
          <Image
            source={{ uri: city.image }}
            style={{ width, height: heroHeight }}
            resizeMode="cover"
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
          />
          <YStack
            position="absolute"
            l={0}
            r={0}
            b={0}
            px={H_PADDING}
            pb="$5"
            gap="$1"
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
              {city.name}
            </H1>
            <XStack items="center" gap="$3">
              <SizableText
                size="$3"
                fontFamily="$body"
                color="$onMediaMuted"
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                numberOfLines={1}
              >
                {city.country}
              </SizableText>
              <RatingStars
                mode="display"
                aggregate={city.rating}
                compact
                showEmptyState
                onPress={onTapRating}
              />
            </XStack>
          </YStack>
        </YStack>
        {city.editorPick && (
          <YStack px="$2" mt={-14} z={6}>
            <EditorsPickBanner pick={city.editorPick} />
          </YStack>
        )}
        {city.audioUrl && (
          <YStack
            px={H_PADDING}
            mt={city.editorPick ? '$3' : -14}
            z={5}
          >
            <AudioPlayer
              audioUrl={city.audioUrl}
              title={t('city.audioTitle')}
              promptKey="city.audioPrompt"
              playingKey="city.audioPlaying"
              analyticsSourceType="city"
              analyticsSourceId={city.id}
            />
          </YStack>
        )}
        <YStack px={H_PADDING} pt="$5" gap="$3">
          {/* Excursions is the hero feature — expanded by default. The
              other 13 categories collapse by default so the initial view
              is a scannable index rather than a wall of content. Distance
              sort is disabled for excursions (excursion = route, not a
              single point). */}
          <CategorySection
            title={t('city.sections.excursions')}
            icon={Compass}
            items={city.excursions}
            hrefFor={(item) => `/excursion/${item.id}`}
            defaultOpen
            allowDistanceSort={false}
            userLocation={userLocation}
            renderTrailingBadge={(item) => (
              <WeatherBadge
                coords={item.coords}
                sensitivity={item.weatherSensitivity}
              />
            )}
          />
          <CategorySection
            title={t('city.sections.restaurants')}
            icon={UtensilsCrossed}
            items={city.restaurants}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.cafes')}
            icon={Coffee}
            items={city.cafes}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.pastries')}
            icon={Cake}
            items={city.pastries}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.brunches')}
            icon={EggFried}
            items={city.brunches}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.bars')}
            icon={Wine}
            items={city.bars}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.shopping')}
            icon={ShoppingBag}
            items={city.shopping}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.events')}
            icon={CalendarDays}
            items={city.events}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.museums')}
            icon={Landmark}
            items={city.museums}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.viewpoints')}
            icon={Mountain}
            items={city.viewpoints}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.parks')}
            icon={Trees}
            items={city.parks}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.workshops')}
            icon={Brush}
            items={city.workshops}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.playareas')}
            icon={Baby}
            items={city.playareas}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.kidsFriendly')}
            icon={Users}
            items={city.kidsFriendly}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.petFriendly')}
            icon={PawPrint}
            items={city.petFriendly}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
          <CategorySection
            title={t('city.sections.locals')}
            icon={Heart}
            items={city.locals}
            hrefFor={(item) => `/place/${item.id}`}
            userLocation={userLocation}
          />
        </YStack>
        {/* Related stories: renders nothing if the city has no tied
            blog posts, so screens that don't have editorial coverage
            stay uncluttered. Lives OUTSIDE the H_PADDING YStack so its
            horizontal scroll can bleed to the screen edge. */}
        <RelatedStories citySlug={city.id} />
      </ScrollView>
      <BackButton topInset={insets.top} onPress={goBack} />
      <YStack
        position="absolute"
        t={insets.top + 8}
        r={H_PADDING}
        z={10}
      >
        <FavoriteButton refToFavorite={{ type: 'city', id: city.id }} />
      </YStack>

      <RatingPromptSheet
        visible={ratingPrompt.visible}
        onClose={ratingPrompt.close}
        targetType="city"
        targetId={city.id}
        entityName={city.name}
      />
    </YStack>
  )
}

// Groups items by `subCategory` when any item in the bucket has one. Items
// without a sub-category fall into an "Other" trailing group so the labels
// stay consistent — never showing a stray ungrouped item above a labeled one.
function groupBySubCategory(
  items: PublicCategoryItem[],
  otherLabel: string,
): Array<{ label: string | null; items: PublicCategoryItem[] }> {
  const anyHasSub = items.some((i) => i.subCategory && i.subCategory.trim())
  if (!anyHasSub) {
    return [{ label: null, items }]
  }

  // Preserve the api-returned order within each group. We iterate once and
  // bucket by sub-category label; entries without a sub-category go into
  // "Other". Group order is determined by first occurrence in the source,
  // then "Other" is appended at the very end if it has anything.
  const groupsInOrder: string[] = []
  const byLabel = new Map<string, PublicCategoryItem[]>()
  const orphans: PublicCategoryItem[] = []

  for (const item of items) {
    const label = item.subCategory?.trim()
    if (!label) {
      orphans.push(item)
      continue
    }
    if (!byLabel.has(label)) {
      byLabel.set(label, [])
      groupsInOrder.push(label)
    }
    byLabel.get(label)!.push(item)
  }

  const groups = groupsInOrder.map((label) => ({
    label,
    items: byLabel.get(label)!,
  }))
  if (orphans.length > 0) {
    groups.push({ label: otherLabel, items: orphans })
  }
  return groups
}

// Max items shown when a category is expanded but the user hasn't asked
// to see everything. "Browse all N" reveals the rest inline. Same cap
// applies to flat + grouped lists (grouped lists cap the TOTAL count,
// then partition across groups in received order).
const PREVIEW_LIMIT = 5

type SortMode = 'editorial' | 'rating' | 'distance'

function CategorySection({
  title,
  icon,
  items,
  hrefFor,
  defaultOpen = false,
  allowDistanceSort = true,
  userLocation,
  renderTrailingBadge,
}: {
  title: string
  icon: React.ComponentType<IconProps>
  items?: PublicCategoryItem[]
  hrefFor?: (item: PublicCategoryItem) => string
  // Only the excursions section opts into being expanded on first render.
  // Everything else stays collapsed so the initial CityDetail view is a
  // scannable index rather than a wall of content.
  defaultOpen?: boolean
  // Excursions are routes, not points — distance sort makes no sense.
  // Callers set this to false to suppress the chip.
  allowDistanceSort?: boolean
  // Passed down from the screen for the "distance from me" sort. Null when
  // permission was denied or resolution hasn't landed yet — the chip stays
  // available but tapping it falls back to editorial ordering.
  userLocation?: LatLng | null
  // Optional per-row right-side chip. Excursions section passes a weather
  // badge; other categories omit it.
  renderTrailingBadge?: (item: PublicCategoryItem) => React.ReactNode
}) {
  const { t } = useTranslation()
  const [sortMode, setSortMode] = useState<SortMode>('editorial')
  const [showAll, setShowAll] = useState(false)

  // Sorted view of items. Rating/Distance both keep unsortable items
  // (missing rating or coords) at the end in their original order —
  // never move them to the top on absence of signal.
  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return []
    if (sortMode === 'editorial') return items
    if (sortMode === 'rating') {
      return [...items].sort((a, b) => {
        const aHas = a.rating != null
        const bHas = b.rating != null
        if (aHas && !bHas) return -1
        if (!aHas && bHas) return 1
        if (!aHas && !bHas) return 0
        return (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0)
      })
    }
    // distance
    if (!userLocation) return items
    return [...items].sort((a, b) => {
      const aHas = a.coords != null
      const bHas = b.coords != null
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      if (!aHas && !bHas) return 0
      const da = haversineMeters(userLocation, a.coords!)
      const db = haversineMeters(userLocation, b.coords!)
      return da - db
    })
  }, [items, sortMode, userLocation])

  if (!items || items.length === 0) return null

  const groups = groupBySubCategory(sortedItems, t('city.subCategoryOther'))
  const isFlat = groups.length === 1 && groups[0].label === null

  // Cap logic — when the total exceeds PREVIEW_LIMIT and the user hasn't
  // asked to see all, slice the visible items down. For grouped lists we
  // slice the flat sequence and then re-partition the visible portion,
  // dropping empty groups so a group with 0 visible items doesn't render
  // a lonely label.
  const overCap = sortedItems.length > PREVIEW_LIMIT
  const visibleItems = overCap && !showAll
    ? sortedItems.slice(0, PREVIEW_LIMIT)
    : sortedItems
  const visibleGroups = isFlat
    ? [{ label: null, items: visibleItems }]
    : (() => {
        // Re-partition the visible slice by subCategory to preserve labels.
        const visibleSet = new Set(visibleItems.map((i) => i.id))
        return groups
          .map((g) => ({
            label: g.label,
            items: g.items.filter((i) => visibleSet.has(i.id)),
          }))
          .filter((g) => g.items.length > 0)
      })()

  const sortChipsRow = (
    <XStack gap="$2" px="$4" pt="$3" flexWrap="wrap">
      <SortChip
        label={t('city.sort.editorial', { defaultValue: 'Featured' })}
        active={sortMode === 'editorial'}
        onPress={() => setSortMode('editorial')}
      />
      <SortChip
        label={t('city.sort.rating', { defaultValue: 'Top rated' })}
        active={sortMode === 'rating'}
        onPress={() => setSortMode('rating')}
      />
      {allowDistanceSort && userLocation && (
        <SortChip
          label={t('city.sort.distance', { defaultValue: 'Nearest' })}
          active={sortMode === 'distance'}
          onPress={() => setSortMode('distance')}
        />
      )}
    </XStack>
  )

  return (
    <Accordion title={title} icon={icon} count={items.length} defaultOpen={defaultOpen}>
      {sortChipsRow}
      {isFlat
        ? visibleGroups[0].items.map((item, idx) => (
            <CategoryListItem
              key={item.id}
              item={item}
              isLast={idx === visibleGroups[0].items.length - 1 && !overCap}
              href={hrefFor?.(item)}
              trailingBadge={renderTrailingBadge?.(item)}
            />
          ))
        : visibleGroups.map((group, gIdx) => (
            <YStack key={group.label ?? `__group-${gIdx}`}>
              {group.label && (
                <YStack px="$4" pt="$3" pb="$1.5">
                  <SizableText
                    size="$2"
                    fontFamily="$body"
                    fontWeight="600"
                    color="$colorPress"
                    style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                  >
                    {group.label}
                  </SizableText>
                </YStack>
              )}
              {group.items.map((item, idx) => (
                <CategoryListItem
                  key={item.id}
                  item={item}
                  isLast={
                    idx === group.items.length - 1 &&
                    gIdx === visibleGroups.length - 1 &&
                    !overCap
                  }
                  href={hrefFor?.(item)}
                  trailingBadge={renderTrailingBadge?.(item)}
                />
              ))}
            </YStack>
          ))}
      {overCap && (
        <Pressable onPress={() => setShowAll((prev) => !prev)} hitSlop={6}>
          <YStack items="center" py="$3" borderTopWidth={1} borderColor="$borderColor">
            <SizableText
              size="$3"
              fontFamily="$body"
              fontWeight="600"
              color="$primary"
            >
              {showAll
                ? t('city.browseCollapse', { defaultValue: 'Show fewer' })
                : t('city.browseAll', {
                    count: items.length,
                    defaultValue: `Browse all ${items.length}`,
                  })}
            </SizableText>
          </YStack>
        </Pressable>
      )}
    </Accordion>
  )
}

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <YStack
        px="$2.5"
        py="$1"
        rounded="$10"
        borderWidth={1}
        borderColor={active ? '$primary' : '$borderColor'}
        bg={active ? '$primary' : 'transparent'}
      >
        <SizableText
          size="$2"
          fontFamily="$body"
          fontWeight="600"
          color={active ? '$colorOnBrand' : '$colorPress'}
        >
          {label}
        </SizableText>
      </YStack>
    </Pressable>
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
