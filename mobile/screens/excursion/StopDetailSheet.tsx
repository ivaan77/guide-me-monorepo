import { useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Image,
  ScrollView,
  type ViewToken,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { H3, Paragraph, XStack, YStack } from 'tamagui'
import { AudioPlayer } from '../../common/AudioPlayer'
import { BottomSheet } from '../../common/BottomSheet'
import type { PublicExcursionStop as ExcursionStop } from '@guide-me-app/core'

const H_PADDING = 20

type Props = {
  visible: boolean
  stop: ExcursionStop | null
  onClose: () => void
}

export function StopDetailSheet({ visible, stop, onClose }: Props) {
  if (!stop) return null

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.88}
      header={
        <XStack px={H_PADDING} pt="$2" pb="$3" items="center">
          <H3 fontFamily="$body" fontWeight="700" color="$color" flex={1}>
            {stop.name}
          </H3>
        </XStack>
      }
    >
      <StopBody stop={stop} />
    </BottomSheet>
  )
}

function StopBody({ stop }: { stop: ExcursionStop }) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  const images = stop.images?.length ? stop.images : [stop.image]
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
              style={{ width: screenWidth, height: screenWidth * 0.7 }}
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
          <AudioPlayer
            audioUrl={stop.audioUrl}
            title={t('excursion.stopSheet.audioTitle')}
          />
          <Paragraph color="$color" fontFamily="$body" size="$4" lineHeight="$6">
            {stop.description}
          </Paragraph>
        </YStack>
      </ScrollView>
    </>
  )
}
