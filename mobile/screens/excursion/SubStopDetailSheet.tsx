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
import { FavoriteButton } from '../../common/FavoriteButton'
import { useAppTheme } from '../../providers/ThemeContext'
import type { PublicSubStop } from '@guide-me-app/core'

const H_PADDING = 20

type Props = {
  visible: boolean
  sub: PublicSubStop | null
  // Parent excursion + stop slugs — used to build the composite favorite id
  // `excursionId:stopId:subStopId`.
  excursionId: string
  stopId: string
  onClose: () => void
}

// Dedicated detail sheet for a single sub-stop. Mirrors StopDetailSheet's
// layout (image carousel + audio + description) so sub-stops feel like
// first-class destinations rather than nested afterthoughts. Opened by
// tapping a sub-stop row in the stops list or a sub-stop dot on the map.
export function SubStopDetailSheet(props: Props) {
  return <SubStopDetailSheetInner {...props} />
}

function SubStopDetailSheetInner({
  visible,
  sub,
  excursionId,
  stopId,
  onClose,
}: Props) {
  const { c } = useAppTheme()
  if (!sub) return null
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.88}
      header={
        <XStack px={H_PADDING} pt="$2" pb="$3" items="center">
          <H3 fontFamily="$body" fontWeight="700" color={c.text as any} flex={1}>
            {sub.name}
          </H3>
        </XStack>
      }
    >
      <SubStopBody sub={sub} excursionId={excursionId} stopId={stopId} />
    </BottomSheet>
  )
}

function SubStopBody({
  sub,
  excursionId,
  stopId,
}: {
  sub: PublicSubStop
  excursionId: string
  stopId: string
}) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { c } = useAppTheme()

  const images = sub.images?.length ? sub.images : [sub.image]
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

  const favoriteRef = {
    type: 'sub-stop' as const,
    id: `${excursionId}:${stopId}:${sub.id}`,
  }

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
        <YStack position="absolute" t="$3" r="$3" z={1}>
          <FavoriteButton refToFavorite={favoriteRef} />
        </YStack>
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack px={H_PADDING} pt="$4" gap="$3">
          <AudioPlayer
            audioUrl={sub.audioUrl}
            title={t('excursion.stopSheet.audioTitle')}
            analyticsSourceType="sub_stop"
            analyticsSourceId={sub.id}
          />
          <Paragraph color={c.text as any} fontFamily="$body" size="$4" lineHeight="$6">
            {sub.description}
          </Paragraph>
        </YStack>
      </ScrollView>
    </>
  )
}
