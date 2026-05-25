import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { YStack } from 'tamagui'
import { useAppTheme } from '../providers/ThemeContext'

const SWIPE_DISMISS_THRESHOLD = 100

type Props = {
  visible: boolean
  onClose: () => void
  heightRatio?: number
  /**
   * Header rendered above the body. The drag-to-dismiss gesture is captured
   * here so inner scroll views and carousels in `children` are not affected.
   */
  header?: ReactNode
  children: ReactNode
}

export function BottomSheet({
  visible,
  onClose,
  heightRatio = 0.85,
  header,
  children,
}: Props) {
  const { height: screenHeight } = useWindowDimensions()
  const sheetHeight = screenHeight * heightRatio
  const { c } = useAppTheme()

  // Slide + fade animations driven manually so we control the dismiss animation
  // and avoid the platform Modal's default slide flash.
  const translateY = useRef(new Animated.Value(sheetHeight)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, sheetHeight, translateY, backdropOpacity])

  // PanResponder lives only on the header area, so it never competes with
  // inner FlatList / ScrollView gestures inside `children`.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy)
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > SWIPE_DISMISS_THRESHOLD || gesture.vy > 0.7) {
            onClose()
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 6,
            }).start()
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start()
        },
      }),
    [onClose, translateY],
  )

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: c.overlay,
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View
          style={{
            height: sheetHeight,
            transform: [{ translateY }],
          }}
        >
          <YStack
            bg="$surface"
            flex={1}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View {...panResponder.panHandlers}>
              <YStack items="center" pt="$2.5" pb="$1">
                <YStack width={44} height={4} rounded={2} bg="$borderColor" />
              </YStack>
              {header}
            </View>
            {children}
          </YStack>
        </Animated.View>
      </View>
    </Modal>
  )
}
