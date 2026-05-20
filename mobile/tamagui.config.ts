import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'
import { palette } from './constants/Colors'
//: TODO: login
//: todo: favorites
//: todo refactor admin
//todo: icon and splash

const lightOverrides = {
  background: palette.sand50,
  backgroundHover: palette.sand100,
  backgroundPress: palette.sand200,
  backgroundFocus: palette.sand100,
  color: palette.stone900,
  colorHover: palette.stone900,
  colorPress: palette.stone500,
  colorFocus: palette.stone900,
  borderColor: palette.sand200,
  borderColorHover: palette.sand200,
  borderColorPress: palette.sand200,
  borderColorFocus: palette.sand200,
  placeholderColor: palette.stone500,
  primary: palette.terracotta500,
  primaryPress: palette.terracotta600,
  accent: palette.amber500,
  surface: palette.white,
  surfaceMuted: palette.sand100,
}

const darkOverrides = {
  background: palette.black,
  backgroundHover: '#26221F',
  backgroundPress: '#3A332D',
  backgroundFocus: '#26221F',
  color: palette.sand50,
  colorHover: palette.sand50,
  colorPress: '#A8A29E',
  colorFocus: palette.sand50,
  borderColor: '#3A332D',
  borderColorHover: '#3A332D',
  borderColorPress: '#3A332D',
  borderColorFocus: '#3A332D',
  placeholderColor: '#A8A29E',
  primary: palette.amber500,
  primaryPress: palette.terracotta500,
  accent: palette.terracotta500,
  surface: palette.stone900,
  surfaceMuted: '#26221F',
}

export const config = createTamagui({
  ...defaultConfig,
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
