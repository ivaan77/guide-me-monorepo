import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Shimmer, useShimmerProgress } from '../../common/Shimmer'

const H_PADDING = 20

export function ExcursionSkeleton() {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const progress = useShimmerProgress()

  const mapHeight = height * 0.5
  const rowWidth = width - H_PADDING * 2

  return (
    <YStack flex={1} bg="$background">
      <Shimmer width={width} height={mapHeight} progress={progress} />

      <YStack flex={1} px={H_PADDING} pt="$3" gap="$2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <XStack key={idx} items="center" gap="$3" py="$2.5">
            <Shimmer width={28} height={28} radius={14} progress={progress} />
            <Shimmer width={44} height={44} radius={10} progress={progress} />
            <YStack flex={1} gap="$1">
              <Shimmer width={rowWidth * 0.45} height={14} radius={4} progress={progress} />
              <Shimmer width={rowWidth * 0.25} height={10} radius={4} progress={progress} />
            </YStack>
          </XStack>
        ))}
      </YStack>

      <YStack
        bg="$surface"
        borderTopWidth={1}
        borderColor="$borderColor"
        px={H_PADDING}
        pt="$4"
        pb={Math.max(insets.bottom, 16)}
        gap="$3"
      >
        <Shimmer width={rowWidth * 0.4} height={16} radius={4} progress={progress} />
        <Shimmer width={rowWidth * 0.7} height={12} radius={4} progress={progress} />
        <Shimmer width={rowWidth} height={48} radius={20} progress={progress} />
      </YStack>
    </YStack>
  )
}
