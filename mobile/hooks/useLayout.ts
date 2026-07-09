import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

// Breakpoint thresholds (logical pixels, i.e. dp/pt).
// Rationale:
//   isSmall   — iPhone SE class (375pt) and older Androids. Certain layouts
//               (button rows, floating overlays) need to stack or shrink here.
//   isMedium  — iPhone 15 Pro / Pixel 7 mid-range phones (~390–430pt).
//   isLarge   — iPhone 15 Pro Max / larger Androids (>430pt).
//   isTablet  — iPad mini and up (>=768pt). Triggers multi-column layouts
//               and larger side padding.
const SMALL_MAX = 380
const MEDIUM_MAX = 600
const TABLET_MIN = 768

export type Layout = {
  screen: { width: number; height: number }
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isTablet: boolean
  // Convenience: any non-tablet phone. Most screens branch on tablet OR
  // small-phone; medium/large are usually treated as "the default."
  isPhone: boolean
}

// Reactive layout info: recomputes when the window changes (rotation on
// tablets, split-screen on Android). Wraps useWindowDimensions so callers
// get a small, semantic API instead of chasing width comparisons inline.
export function useLayout(): Layout {
  const { width, height } = useWindowDimensions()
  return useMemo(() => {
    const isTablet = width >= TABLET_MIN
    const isSmall = !isTablet && width < SMALL_MAX
    const isMedium = !isTablet && width >= SMALL_MAX && width < MEDIUM_MAX
    const isLarge = !isTablet && width >= MEDIUM_MAX
    return {
      screen: { width, height },
      isSmall,
      isMedium,
      isLarge,
      isTablet,
      isPhone: !isTablet,
    }
  }, [width, height])
}
