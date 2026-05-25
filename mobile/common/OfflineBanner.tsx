import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SizableText, XStack } from 'tamagui'
import { WifiOff } from '@tamagui/lucide-icons'
import { useNetwork } from '../providers/NetworkContext'

const BANNER_HEIGHT = 32

// Slides down from above the status bar when the device goes offline,
// slides back up when it reconnects. Sits absolutely at the top of the
// screen, above all routes, so it never affects layout when hidden.
export function OfflineBanner() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { isOnline } = useNetwork()

  // -1 = fully hidden above the top edge, 0 = visible.
  const progress = useSharedValue(isOnline ? -1 : 0)

  useEffect(() => {
    progress.value = withTiming(isOnline ? -1 : 0, { duration: 220 })
  }, [isOnline, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          progress.value * (insets.top + BANNER_HEIGHT),
      },
    ],
    opacity: progress.value === -1 ? 0 : 1,
  }))

  return (
    <Animated.View
      pointerEvents={isOnline ? 'none' : 'auto'}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top,
          backgroundColor: '#1A2A45',
          zIndex: 1000,
        },
        animatedStyle,
      ]}
    >
      <XStack
        items="center"
        justify="center"
        gap="$2"
        height={BANNER_HEIGHT}
        px="$4"
      >
        <WifiOff size={14} color="#FFFFFF" />
        <SizableText
          size="$2"
          color="#FFFFFF"
          fontFamily="$body"
          fontWeight="600"
        >
          {t('common.offline')}
        </SizableText>
      </XStack>
    </Animated.View>
  )
}
