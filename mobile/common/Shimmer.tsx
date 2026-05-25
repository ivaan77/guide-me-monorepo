import { useEffect } from 'react'
import Animated, {
  Easing,
  type SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { YStack } from 'tamagui'

const STRIPE_WIDTH_RATIO = 0.6

// Shared looping progress driver. Each Shimmer instance creates its own; if
// you need many side-by-side, pass `progress` from useShimmerProgress() into
// every <Shimmer> so they all animate in sync (cheaper than N timers).
export function useShimmerProgress(): SharedValue<number> {
  const progress = useSharedValue(-1)
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    )
    return () => cancelAnimation(progress)
  }, [progress])
  return progress
}

type Props = {
  width: number
  height: number
  radius?: number | string
  progress?: SharedValue<number>
}

export function Shimmer({ width, height, radius, progress }: Props) {
  const ownProgress = useShimmerProgress()
  const p = progress ?? ownProgress
  const stripeWidth = width * STRIPE_WIDTH_RATIO

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: p.value * (width + stripeWidth) - stripeWidth },
    ],
  }))

  return (
    <YStack
      width={width}
      height={height}
      bg="$surfaceMuted"
      overflow="hidden"
      rounded={radius as never}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: stripeWidth,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
          },
          animatedStyle,
        ]}
      />
    </YStack>
  )
}
