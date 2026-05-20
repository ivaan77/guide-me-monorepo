import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, createFont } from 'tamagui'
import { palette } from './constants/Colors'

const lightOverrides = {
  background: palette.neutral50,
  backgroundHover: palette.neutral100,
  backgroundPress: palette.neutral200,
  backgroundFocus: palette.neutral100,
  color: palette.navy,
  colorHover: palette.primary,
  colorPress: palette.primary,
  colorFocus: palette.navy,
  borderColor: palette.neutral300,
  borderColorHover: palette.neutral400,
  borderColorPress: palette.primary,
  borderColorFocus: palette.primary,
  placeholderColor: palette.neutral500,
  primary: palette.primary,
  primaryPress: '#1F46A8',
  accent: palette.amber,
  surface: palette.neutral100,
  surfaceMuted: palette.neutral200,
}

const darkOverrides = {
  background: palette.darkCanvas,
  backgroundHover: palette.darkSurface,
  backgroundPress: palette.darkSurface2,
  backgroundFocus: palette.darkSurface,
  color: '#F5F7FA',
  colorHover: palette.bright,
  colorPress: palette.bright,
  colorFocus: '#F5F7FA',
  borderColor: palette.darkBorder,
  borderColorHover: palette.darkBorderStrong,
  borderColorPress: palette.bright,
  borderColorFocus: palette.bright,
  placeholderColor: palette.darkInk3,
  primary: palette.bright,
  primaryPress: palette.primary,
  accent: palette.amber,
  surface: palette.darkSurface,
  surfaceMuted: palette.darkSurface2,
}

// GuideMe display font — Bricolage Grotesque. Used for headings/UI emphasis.
// Font files are loaded once in app/_layout.tsx via expo-font; the keys we
// register there must match `face[weight].normal` here.
const displayFont = createFont({
  family: 'BricolageGrotesque',
  size: { 1: 11, 2: 12, 3: 14, 4: 16, 5: 19, 6: 20, 7: 24, 8: 28, 9: 40, 10: 64, 11: 96, true: 16 },
  lineHeight: { 1: 16, 2: 16, 3: 20, 4: 24, 5: 28, 6: 28, 7: 32, 8: 36, 9: 48, 10: 68, 11: 96, true: 24 },
  weight: { 1: '400', 4: '600', 6: '700', 8: '800' },
  letterSpacing: { 1: 0, 4: -0.4, 6: -0.6, 8: -1 },
  face: {
    400: { normal: 'BricolageGrotesque-Regular' },
    600: { normal: 'BricolageGrotesque-SemiBold' },
    700: { normal: 'BricolageGrotesque-Bold' },
    800: { normal: 'BricolageGrotesque-ExtraBold' },
  },
})

// GuideMe body font — Geist.
const bodyFont = createFont({
  family: 'Geist',
  size: { 1: 11, 2: 12, 3: 14, 4: 16, 5: 19, 6: 20, 7: 24, 8: 28, 9: 40, 10: 64, 11: 96, true: 16 },
  lineHeight: { 1: 16, 2: 16, 3: 20, 4: 24, 5: 28, 6: 28, 7: 32, 8: 36, 9: 48, 10: 68, 11: 96, true: 24 },
  weight: { 1: '400', 2: '500', 3: '600', 4: '700' },
  letterSpacing: { 1: 0, 2: 0, 3: -0.1, 4: -0.2 },
  face: {
    400: { normal: 'Geist-Regular' },
    500: { normal: 'Geist-Medium' },
    600: { normal: 'Geist-SemiBold' },
    700: { normal: 'Geist-Bold' },
  },
})

const monoFont = createFont({
  family: 'GeistMono',
  size: { 1: 10, 2: 11, 3: 12, 4: 13, 5: 14, true: 12 },
  lineHeight: { 1: 14, 2: 16, 3: 16, 4: 18, 5: 20, true: 16 },
  weight: { 1: '400', 2: '500' },
  letterSpacing: { 1: 0, 2: 0 },
  face: {
    400: { normal: 'GeistMono-Regular' },
    500: { normal: 'GeistMono-Medium' },
  },
})

export const config = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: bodyFont,
    heading: displayFont,
    mono: monoFont,
  },
  themes: {
    ...defaultConfig.themes,
    light: { ...defaultConfig.themes.light, ...lightOverrides },
    dark: { ...defaultConfig.themes.dark, ...darkOverrides },
  },
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
