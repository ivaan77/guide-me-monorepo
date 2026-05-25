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
  ChevronLeft,
  Compass,
  ShoppingBag,
  UtensilsCrossed,
  Wine,
} from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PublicCategoryItem } from '@guide-me-app/core'
import { H1, SizableText, XStack, YStack } from 'tamagui'
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
    else router.replace('/')
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
          <YStack px={H_PADDING} mt={-14} z={5}>
            <EditorsPickBanner pick={city.editorPick} />
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
  if (!items || items.length === 0) return null
  return (
    <Accordion title={title} icon={icon} count={items.length}>
      {items.map((item, idx) => (
        <CategoryListItem
          key={item.id}
          item={item}
          isLast={idx === items.length - 1}
          href={hrefFor?.(item)}
        />
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
