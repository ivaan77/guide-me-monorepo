import { useEffect, useRef } from 'react'
import {
  Image,
  Modal,
  PanResponder,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from '@tamagui/lucide-icons'
import { YStack } from 'tamagui'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

// Full-screen image viewer with black backdrop. Tap anywhere to dismiss;
// swipe down (≥120px) also dismisses. Image is contained inside the screen
// bounds preserving aspect ratio. Suitable for stop photos, place photos,
// any "tap to enlarge" surface.
//
// Renders inside a Modal so it stacks above bottom sheets and other
// presentational layers without z-index gymnastics.

type Props = {
  uri: string | null
  onClose: () => void
}

const DISMISS_THRESHOLD = 120

export function ImageLightbox({ uri, onClose }: Props) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const visible = !!uri

  // Vertical drag offset for swipe-to-dismiss. Reset to 0 each time the
  // sheet opens so a previous gesture doesn't pre-bias the new view.
  const translateY = useSharedValue(0)
  useEffect(() => {
    if (visible) translateY.value = 0
  }, [visible, translateY])

  // PanResponder lives outside reanimated; it reads/writes the shared value
  // directly. We could use react-native-gesture-handler but that's an extra
  // dep we don't currently have, and PanResponder is good enough for a
  // single-axis dismiss gesture.
  const panResponder = useRef(
    PanResponder.create({
      // Only capture the gesture once the user has actually started dragging
      // vertically; below that threshold, taps still propagate to the
      // backdrop press handler.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        // Only follow downward drags. Upward goes nowhere.
        translateY.value = Math.max(0, g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD) {
          onClose()
        } else {
          translateY.value = withTiming(0, { duration: 200 })
        }
      },
      onPanResponderTerminate: () => {
        translateY.value = withTiming(0, { duration: 200 })
      },
    }),
  ).current

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    // Fade the image slightly as it's pulled down so the user sees the
    // dismiss intention. Caps at 40% opacity reduction.
    opacity: 1 - Math.min(0.4, translateY.value / 400),
  }))

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {visible && (
        <Animated.View
          entering={FadeIn.duration(200).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(180)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }}
        >
          <Pressable
            onPress={onClose}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Animated.View
              style={animatedImageStyle}
              {...panResponder.panHandlers}
            >
              <Image
                source={{ uri: uri ?? undefined }}
                // ~95% of viewport so there's a comfortable letterbox border
                // around the image, especially on very wide photos.
                style={{ width: width * 0.95, height: height * 0.8 }}
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
          <YStack
            position="absolute"
            t={insets.top + 8}
            r={20}
          >
            <Pressable onPress={onClose} hitSlop={8}>
              <YStack
                width={40}
                height={40}
                rounded={20}
                items="center"
                justify="center"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
              >
                <X size={22} color="#FFFFFF" />
              </YStack>
            </Pressable>
          </YStack>
        </Animated.View>
      )}
    </Modal>
  )
}
