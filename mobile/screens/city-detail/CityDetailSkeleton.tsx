import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Shimmer, useShimmerProgress } from '../../common/Shimmer'

const HERO_RATIO = 0.85
const H_PADDING = 20

export function CityDetailSkeleton() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const heroHeight = width * HERO_RATIO
  const progress = useShimmerProgress()
  const bodyWidth = width - H_PADDING * 2

  return (
    <YStack flex={1} bg="$background">
      <Shimmer width={width} height={heroHeight} progress={progress} />

      <YStack px={H_PADDING} mt={-14} z={5}>
        <Shimmer width={bodyWidth} height={84} radius={24} progress={progress} />
      </YStack>

      <YStack px={H_PADDING} pt="$5" gap="$3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <XStack
            key={idx}
            items="center"
            gap="$3"
            bg="$surface"
            rounded="$5"
            borderWidth={1}
            borderColor="$borderColor"
            px="$4"
            py="$3.5"
          >
            <Shimmer width={32} height={32} radius={16} progress={progress} />
            <Shimmer width={bodyWidth * 0.45} height={14} radius={4} progress={progress} />
          </XStack>
        ))}
      </YStack>

      <YStack height={insets.bottom} />
    </YStack>
  )
}
