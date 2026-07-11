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

// Maximum content width on tablet screens (>=768pt). Prevents scrolling
// content and modal sheets from stretching to the full 1024pt+ of an iPad,
// which produces unreadably wide text lines and a stretched hero image.
// Phones (<768pt) ignore this cap — they use their full screen width.
// 640pt = comfortably reads as "an iPhone-Pro-Max-sized column" centered
// on iPad; big enough that images look substantial, small enough that
// paragraph text stays within the 60-80 char comfort zone.
export const TABLET_MAX_CONTENT_WIDTH = 640

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
//   <View style={SHADOW.card}>...</View>
// or with Tamagui:
//   <YStack style={SHADOW.card}>...</YStack>
//
// Presets are named by intent (what surface they belong on), not by size:
//   subtle       — decorative lift for inline cards that shouldn't compete
//                  with dominant UI (off-route banner, start-from chip).
//   pin          — map markers that need to pop off the map tiles.
//   card         — resting FABs / recenter button on the map.
//   pillFloating — dark chips floating over the map (nearest-stop pill,
//                  undo-skip pill). Higher opacity to survive the map's
//                  visual noise.
//   modal        — modal overlays (LocationDeniedOverlay, prompt sheets).
//   liftUp       — inverted shadow for bottom-panel top edge (the chrome
//                  that separates the map from the scrollable panel).
//                  Uses a negative Y offset.
//
// shadowColor stays black across the app; if a theme-tinted shadow is
// needed later, add a per-mode variant rather than parameterizing here.
export const SHADOW = {
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pin: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pillFloating: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  liftUp: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    // No `elevation` — Android draws shadows only downward (from the
    // library), so an upward shadow would look wrong. iOS handles the
    // negative offset naturally; on Android the border-top on the
    // container carries the visual separation.
  },
  // Extra-tight shadow for very small map badges (bundle count pin).
  // Radius 2 keeps the shadow from smearing at the pin's small size.
  pinTight: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  // ---- Amber-tinted variants ----
  // Used on branded chrome (editor's pick banner, "did you know" fact
  // banner/player, nearest-stop callout). The amber shadow color reinforces
  // the amber accent theme — do NOT swap for the black variants above,
  // it flattens the branded look.
  amberCard: {
    shadowColor: '#B26B00',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  amberPill: {
    shadowColor: '#B26B00',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  amberFloating: {
    shadowColor: '#B26B00',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const
