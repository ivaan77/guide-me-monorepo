import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  Image,
  ScrollView,
  type ViewToken,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H3, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { BottomSheet } from '../../common/BottomSheet'
import type { PoiCategory, PublicPoi as Poi } from '@guide-me-app/core'

const H_PADDING = 20

const CATEGORY_EMOJI: Record<PoiCategory, string> = {
  restaurant: '🍴',
  bar: '🍸',
  shopping: '🛍️',
}

type Props = {
  visible: boolean
  poi: Poi | null
  onClose: () => void
}

export function PoiDetailSheet({ visible, poi, onClose }: Props) {
  const { t } = useTranslation()
  if (!poi) return null

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.82}
      header={
        <YStack px={H_PADDING} pt="$2" pb="$3" gap="$1">
          <XStack items="center" gap="$2">
            <SizableText size="$4">{CATEGORY_EMOJI[poi.category]}</SizableText>
            <SizableText
              size="$2"
              color="$primary"
              fontFamily="$body"
              fontWeight="700"
              style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              {t(`place.category.${poi.category}` as const)}
            </SizableText>
          </XStack>
          <H3 fontFamily="$body" fontWeight="700" color="$color">
            {poi.name}
          </H3>
        </YStack>
      }
    >
      <PoiBody poi={poi} />
    </BottomSheet>
  )
}

function PoiBody({ poi }: { poi: Poi }) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const images = poi.images?.length ? poi.images : [poi.image]
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
    <>
      <YStack>
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
              style={{ width: screenWidth, height: screenWidth * 0.65 }}
              resizeMode="cover"
            />
          )}
        />
        {images.length > 1 && (
          <XStack
            position="absolute"
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
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack px={H_PADDING} pt="$4" gap="$3">
          <Paragraph color="$color" fontFamily="$body" size="$4" lineHeight="$6">
            {poi.description}
          </Paragraph>
        </YStack>
      </ScrollView>
    </>
  )
}
