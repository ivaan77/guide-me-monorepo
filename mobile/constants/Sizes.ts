import { Platform } from 'react-native'

// Semantic sizing tokens. Prefer these over ad-hoc pixel constants scattered
// across screens (each screen used to define its own H_PADDING, TAB_BAR_HEIGHT,
// etc. — same value, redeclared five times). Consuming code should import
// from here so a single edit propagates.
//
// Numbers are in RN "logical pixels" (dp on Android, pt on iOS). Do NOT
// wrap in scale()/moderateScale() — Tamagui + safe-area handle the scaling
// story; adding another scaling layer creates non-obvious compounding.

// Horizontal edge padding around all screen content. Was `H_PADDING = 20`
// duplicated across CityDetailScreen, PlaceDetailScreen, ExcursionScreen,
// DiscoverScreen, etc.
export const SCREEN_PADDING = 20

// Column gutter in multi-column grids (DiscoverScreen 2-col city grid).
export const GRID_GUTTER = 16

// Standard small thumbnail size used in list rows (favorites, category list
// items, stops list). Was `56` or `52` inconsistently.
export const ROW_THUMB = 56
export const ROW_THUMB_RADIUS = 12

// Large avatar (profile screen main avatar).
export const AVATAR_LG = 88
export const AVATAR_LG_RADIUS = AVATAR_LG / 2

// Hero image aspect ratio — height = width * HERO_RATIO. Used on
// CityDetailScreen and PlaceDetailScreen hero carousels. Do NOT let hero
// height exceed a fraction of viewport height on tablets — see
// HERO_MAX_VIEWPORT_RATIO below.
export const HERO_RATIO = 0.85
// Cap the hero at half the viewport height. On phones the width * 0.85
// calc dominates; on tablets (where width is huge) this cap kicks in and
// keeps the fold visible.
export const HERO_MAX_VIEWPORT_RATIO = 0.5

// Bottom tab bar height. Was hardcoded 49/iOS + 80/Android inconsistently.
// - iOS: 49pt is the standard tab bar (matches Apple's UITabBar default).
// - Android: 56dp is the Material Design bottom nav spec (was 80 — overshoot).
// Safe-area bottom insets are added on top of these values by useTabBarPadding.
export const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 56 }) ?? 49

// Bottom padding buffer added AFTER tab bar + safe area, so scrollable
// content doesn't stop flush against the tab bar.
export const TAB_BAR_EXTRA = 16

// Common absolute-position insets for floating UI (recenter button, close
// buttons on modals, etc.). Used to be `right: 20` / `right: 16` mixed.
export const FLOATING_EDGE_PADDING = 16

// Icon size scale. Existing code uses scattered literals — 16, 18, 20, 22,
// 28, 40, 44 — with no semantic anchor. New code should map to these tokens.
// Rationale for the values:
//   xs (14): inline with body text (rating badge star, chevrons on list rows)
//   sm (18): meta rows, small buttons, secondary action icons
//   md (22): primary UI icons (back button, favorite heart, header actions)
//   lg (28): hero-adjacent icons (rating picker star, prominent state icons)
//   xl (44): touch-heavy standalone icons (rating prompt star, empty-state hero)
export const ICON_SIZE = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 44,
} as const

// Shadow presets for elevation. Each preset packages the four iOS shadow
// props + the Android elevation into a single spread. Usage:
//   <View style={SHADOW.medium}>...</View>
// or with Tamagui:
//   <YStack style={SHADOW.medium}>...</YStack>
//
// low    — subtle lift (chips, small cards)
// medium — resting cards, banners
// high   — modals, popovers, floating action buttons
//
// shadowColor stays black across the app; if a theme-tinted shadow is
// needed later, add a per-mode variant rather than parameterizing here.
export const SHADOW = {
  low: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  high: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const
