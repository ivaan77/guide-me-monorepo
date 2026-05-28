import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const IOS_TAB_BAR = 49
const ANDROID_TAB_BAR = 80
const EXTRA = 16

export function useTabBarPadding(): number {
  const insets = useSafeAreaInsets()
  const tabBar = Platform.OS === 'ios' ? IOS_TAB_BAR : ANDROID_TAB_BAR
  return insets.bottom + tabBar + EXTRA
}
