import { Image, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft } from '@tamagui/lucide-icons'
import { H1, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { type PlaceCategory, getPlaceById } from '../../data/cities'
import { EmptyState } from '../discover/EmptyState'

type Props = {
  id: string
  category?: PlaceCategory
}

const HERO_RATIO = 0.85
const H_PADDING = 20
const TAB_BAR_HEIGHT = 49

export function PlaceDetailScreen({ id }: Props) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useTranslation()

  const categoryLabel = (category: PlaceCategory): string =>
    t(`place.category.${category}` as const)

  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  const result = getPlaceById(id)
  if (!result) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 56}>
        <BackButton topInset={insets.top} onPress={goBack} />
        <EmptyState
          variant="error"
          message={t('place.notFound')}
          onRetry={goBack}
        />
      </YStack>
    )
  }

  const { place, category } = result
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
          <XStack
            position="absolute"
            l={0}
            r={0}
            b={0}
            px={H_PADDING}
            pb="$5"
            items="baseline"
            gap="$3"
          >
            <H1
              fontFamily="$body"
              fontWeight="700"
              fontSize="$10"
              lineHeight="$10"
              color="#FFFFFF"
            >
              {place.name}
            </H1>
            <SizableText
              size="$4"
              fontFamily="$body"
              color="rgba(255,255,255,0.78)"
              style={{ textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {categoryLabel(category)}
            </SizableText>
          </XStack>
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
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
      >
        <ChevronLeft size={22} color="#FFFFFF" />
      </YStack>
    </Pressable>
  )
}
