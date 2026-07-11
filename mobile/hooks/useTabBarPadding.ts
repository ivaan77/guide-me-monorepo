import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_BAR_EXTRA, TAB_BAR_HEIGHT } from '../constants/Sizes'

// Bottom padding for scrollable content in tab-hosted screens so the last
// row isn't hidden under the tab bar. Uses:
//   - safe-area bottom inset (home indicator / gesture bar)
//   - the tab bar height token (iOS 49pt / Android 56dp per Material spec)
//   - a small extra buffer so content doesn't sit flush against the bar
export function useTabBarPadding(): number {
  const insets = useSafeAreaInsets()
  return insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_EXTRA
}
