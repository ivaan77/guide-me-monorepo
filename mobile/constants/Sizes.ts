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
