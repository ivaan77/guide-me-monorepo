// GuideMe design system v0.1 — see handoff/tokens/tokens.ts for the source of truth.
// Names are kept semantic (background/surface/border/primary/accent/text/textMuted)
// so screens consuming `c.background` etc. don't change when the palette evolves.

export const palette = {
  // Brand
  navy: '#0B1F3A',
  primary: '#2A5BD7',
  bright: '#4A8BF5',
  sky: '#BDDCFF',
  mist: '#EAF2FE',
  // Accent
  amber: '#FFB23F',
  coral: '#FF7A59',
  // Neutral scale (50–900)
  neutral50: '#FFFFFF',
  neutral100: '#F4F6FA',
  neutral200: '#E8EEF6',
  neutral300: '#D9E1ED',
  neutral400: '#B6C3D6',
  neutral500: '#8294B1',
  neutral600: '#475A77',
  neutral700: '#2C3E5C',
  neutral800: '#1A2A45',
  neutral900: '#0B1F3A',
  // Dark canvases
  darkCanvas: '#07101F',
  darkSurface: '#0E1B2E',
  darkSurface2: '#16263E',
  darkBorder: '#1F3252',
  darkBorderStrong: '#2C4467',
  darkInk2: '#B8C5DA',
  darkInk3: '#7186A3',
  // Semantic
  success: '#1FA971',
  warning: '#F5A524',
  danger: '#E5484D',
  black: '#000000',
}

const Colors = {
  light: {
    background: palette.neutral50,
    surface: palette.neutral100,
    surfaceMuted: palette.neutral200,
    border: palette.neutral300,
    primary: palette.primary,
    primaryPressed: '#1F46A8',
    accent: palette.amber,
    text: palette.navy,
    textMuted: palette.neutral600,
    overlay: 'rgba(11, 31, 58, 0.55)',
    // Foreground for things sitting on a primary/dark surface (e.g. a Primary
    // button label, icon over the hero image overlay). Always light in both
    // themes — that's the whole point.
    onBrand: '#FFFFFF',
    // Translucent surface for chrome over a hero image (back button, etc.).
    // Same in both themes since it lives on top of a media background.
    chromeOverlay: 'rgba(0, 0, 0, 0.45)',
    // Subtitle text on a hero image overlay.
    onMedia: '#FFFFFF',
    onMediaMuted: 'rgba(255,255,255,0.78)',
  },
  dark: {
    background: palette.darkCanvas,
    surface: palette.darkSurface,
    surfaceMuted: palette.darkSurface2,
    border: palette.darkBorder,
    primary: palette.bright,
    primaryPressed: palette.primary,
    accent: palette.amber,
    text: '#F5F7FA',
    textMuted: palette.darkInk2,
    overlay: 'rgba(0, 0, 0, 0.6)',
    onBrand: '#0B1F3A',
    chromeOverlay: 'rgba(0, 0, 0, 0.55)',
    onMedia: '#FFFFFF',
    onMediaMuted: 'rgba(255,255,255,0.78)',
  },
}

export default Colors
