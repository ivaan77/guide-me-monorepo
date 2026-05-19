export const palette = {
  sand50: '#FAF7F2',
  sand100: '#F3EDE3',
  sand200: '#E7DDC9',
  stone500: '#78716C',
  stone700: '#44403C',
  stone900: '#1C1917',
  terracotta500: '#C2410C',
  terracotta600: '#9A3412',
  amber500: '#D97706',
  white: '#FFFFFF',
  black: '#0B0908',
}

const Colors = {
  light: {
    background: palette.sand50,
    surface: palette.white,
    surfaceMuted: palette.sand100,
    border: palette.sand200,
    primary: palette.terracotta500,
    primaryPressed: palette.terracotta600,
    accent: palette.amber500,
    text: palette.stone900,
    textMuted: palette.stone500,
    overlay: 'rgba(28, 25, 23, 0.55)',
  },
  dark: {
    background: palette.black,
    surface: palette.stone900,
    surfaceMuted: '#26221F',
    border: '#3A332D',
    primary: palette.amber500,
    primaryPressed: palette.terracotta500,
    accent: palette.terracotta500,
    text: palette.sand50,
    textMuted: '#A8A29E',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },
}

export default Colors
