import {
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import {
  CalendarDays,
  ChevronLeft,
  Coffee,
  Compass,
  ShoppingBag,
  Trees,
  UtensilsCrossed,
  Wine,
} from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PublicCategoryItem } from '@guide-me-app/core'
import { H1, SizableText, YStack } from 'tamagui'
import { AudioPlayer } from '../../common/AudioPlayer'
import { FavoriteButton } from '../../common/FavoriteButton'
import { useCity } from '../../hooks/useCity'
import { EmptyState } from '../discover/EmptyState'
import { Accordion } from './Accordion'
import { CategoryListItem } from './CategoryListItem'
import { CityDetailSkeleton } from './CityDetailSkeleton'
import { EditorsPickBanner } from './EditorsPickBanner'

type Props = {
  id: string
}

const HERO_RATIO = 0.85
const H_PADDING = 20
const TAB_BAR_HEIGHT = 49

export function CityDetailScreen({ id }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: city, isPending, isError, refetch } = useCity(id)

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
        contentContainerStyle={{ paddingBottom: bottomPadding }}
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
            <SizableText
              size="$3"
              fontFamily="$body"
              color="$onMediaMuted"
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              numberOfLines={1}
            >
              {city.country}
            </SizableText>
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
            />
          </YStack>
        )}
        <YStack px={H_PADDING} pt="$5" gap="$3">
          <CategorySection
            title={t('city.sections.excursions')}
            icon={Compass}
            items={city.excursions}
            hrefFor={(item) => `/excursion/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.restaurants')}
            icon={UtensilsCrossed}
            items={city.restaurants}
            hrefFor={(item) => `/place/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.cafes')}
            icon={Coffee}
            items={city.cafes}
            hrefFor={(item) => `/place/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.bars')}
            icon={Wine}
            items={city.bars}
            hrefFor={(item) => `/place/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.shopping')}
            icon={ShoppingBag}
            items={city.shopping}
            hrefFor={(item) => `/place/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.events')}
            icon={CalendarDays}
            items={city.events}
            hrefFor={(item) => `/place/${item.id}`}
          />
          <CategorySection
            title={t('city.sections.parks')}
            icon={Trees}
            items={city.parks}
            hrefFor={(item) => `/place/${item.id}`}
          />
        </YStack>
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

function CategorySection({
  title,
  icon,
  items,
  hrefFor,
}: {
  title: string
  icon: React.ComponentType<IconProps>
  items?: PublicCategoryItem[]
  hrefFor?: (item: PublicCategoryItem) => string
}) {
  const { t } = useTranslation()
  if (!items || items.length === 0) return null
  const groups = groupBySubCategory(items, t('city.subCategoryOther'))
  // Flat list when there's only one group with no label — preserves the
  // original look for cities that haven't authored sub-categories yet.
  const isFlat = groups.length === 1 && groups[0].label === null
  return (
    <Accordion title={title} icon={icon} count={items.length}>
      {isFlat
        ? groups[0].items.map((item, idx) => (
            <CategoryListItem
              key={item.id}
              item={item}
              isLast={idx === groups[0].items.length - 1}
              href={hrefFor?.(item)}
            />
          ))
        : groups.map((group, gIdx) => (
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
                    idx === group.items.length - 1 && gIdx === groups.length - 1
                  }
                  href={hrefFor?.(item)}
                />
              ))}
            </YStack>
          ))}
    </Accordion>
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
