import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'
import { Shimmer, useShimmerProgress } from '../../common/Shimmer'

const HERO_RATIO = 0.85
const H_PADDING = 20

export function PlaceDetailSkeleton() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const heroHeight = width * HERO_RATIO
  const progress = useShimmerProgress()
  const bodyWidth = width - H_PADDING * 2

  return (
    <YStack flex={1} bg="$background">
      <Shimmer width={width} height={heroHeight} progress={progress} />
      <YStack px={H_PADDING} pt="$5" gap="$3">
        <Shimmer width={bodyWidth * 0.4} height={12} radius={4} progress={progress} />
        <YStack gap="$2" pt="$2">
          <Shimmer width={bodyWidth} height={14} radius={4} progress={progress} />
          <Shimmer width={bodyWidth} height={14} radius={4} progress={progress} />
          <Shimmer width={bodyWidth * 0.85} height={14} radius={4} progress={progress} />
          <Shimmer width={bodyWidth * 0.65} height={14} radius={4} progress={progress} />
        </YStack>
      </YStack>
      <YStack height={insets.bottom} />
    </YStack>
  )
}
