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

// Tamagui's size scale has uneven gaps ($6 20pt -> $5 19pt is a 1pt step),
// so stepping tokens barely changes anything. `fontPx` returns an explicit
// pixel size instead: the design value on a normal phone, and a genuinely
// smaller one on a 375pt screen where the stock sizes read oversized.
//
// Keys are the design intent, not Tamagui tokens:
//   screenTitle  — "Stories", big screen headings
//   sectionTitle — accordion headers ("Excursions", "Restaurants")
//   rowTitle     — list row names ("Market Bistro & Bar")
//   rowMeta      — the muted line under a row title
//   body         — paragraphs
const FONT_PX = {
  screenTitle: { default: 40, small: 24 },
  sectionTitle: { default: 20, small: 14 },
  rowTitle: { default: 16, small: 12.5 },
  rowMeta: { default: 12, small: 10.5 },
  body: { default: 14, small: 12 },
} as const

export type FontRole = keyof typeof FONT_PX

export type FontToken = '$4' | '$5' | '$6' | '$7' | '$8' | '$9' | '$10'

const FONT_STEP_DOWN: Partial<Record<FontToken, FontToken>> = {
  $10: '$9',
  $9: '$8',
  $8: '$7',
  $7: '$6',
  $6: '$5',
  $5: '$4',
}

export type Layout = {
  screen: { width: number; height: number }
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isTablet: boolean
  // Convenience: any non-tablet phone. Most screens branch on tablet OR
  // small-phone; medium/large are usually treated as "the default."
  isPhone: boolean
  /**
   * One rung down the Tamagui font scale on small phones, unchanged
   * elsewhere. `fontStep('$9')` → `'$8'` on an iPhone SE, `'$9'` otherwise.
   */
  fontStep: <T extends FontToken>(token: T) => FontToken
  /** Explicit px size for a semantic text role, scaled on small phones. */
  fontPx: (role: FontRole) => number
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
      fontStep: <T extends FontToken>(token: T): FontToken =>
        isSmall ? (FONT_STEP_DOWN[token] ?? token) : token,
      fontPx: (role: FontRole) =>
        isSmall ? FONT_PX[role].small : FONT_PX[role].default,
    }
  }, [width, height])
}
