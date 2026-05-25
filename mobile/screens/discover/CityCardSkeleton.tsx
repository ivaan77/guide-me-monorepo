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

type Props = {
  width: number
}

const STRIPE_WIDTH_RATIO = 0.6

export function CityCardSkeleton({ width }: Props) {
  const imageHeight = width * 1.15
  const progress = useSharedValue(-1)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    )
    return () => cancelAnimation(progress)
  }, [progress])

  return (
    <YStack
      width={width}
      bg="$surface"
      rounded="$6"
      overflow="hidden"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <ShimmerBlock width={width} height={imageHeight} progress={progress} />
      <YStack py="$3" px="$3" gap="$2" items="center">
        <ShimmerBlock width={width * 0.55} height={14} progress={progress} rounded />
        <ShimmerBlock width={width * 0.35} height={10} progress={progress} rounded />
      </YStack>
    </YStack>
  )
}

function ShimmerBlock({
  width,
  height,
  progress,
  rounded,
}: {
  width: number
  height: number
  progress: SharedValue<number>
  rounded?: boolean
}) {
  const stripeWidth = width * STRIPE_WIDTH_RATIO

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: progress.value * (width + stripeWidth) - stripeWidth,
      },
    ],
  }))

  return (
    <YStack
      width={width}
      height={height}
      bg="$surfaceMuted"
      overflow="hidden"
      rounded={rounded ? '$2' : 0}
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
