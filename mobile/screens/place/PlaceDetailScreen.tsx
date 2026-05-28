import { Image, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft } from '@tamagui/lucide-icons'
import type { PoiCategory } from '@guide-me-app/core'
import { H1, Paragraph, SizableText, YStack } from 'tamagui'
import { FavoriteButton } from '../../common/FavoriteButton'
import { usePlace } from '../../hooks/usePlace'
import { EmptyState } from '../discover/EmptyState'
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
        <YStack width={width} height={heroHeight}>
          <Image
            source={{ uri: place.image }}
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
          <Paragraph
            color="$color"
            fontFamily="$body"
            size="$4"
            lineHeight="$6"
          >
            {place.description ?? t('place.fallbackDescription')}
          </Paragraph>
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
