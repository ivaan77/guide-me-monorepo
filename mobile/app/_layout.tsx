import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque'
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist'
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono'
import { AppProvider } from '../providers/AppProvider'
import { useAppTheme } from '../providers/ThemeContext'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // Keys are the family names Tamagui (and inline `fontFamily:` strings) resolve.
  // Bare-family keys (`BricolageGrotesque`, `Geist`, `GeistMono`) map to the
  // base weight used by Tamagui's createFont; the postscript-style keys give
  // explicit access for direct fontFamily references.
  const [fontsLoaded, fontsError] = useFonts({
    BricolageGrotesque: BricolageGrotesque_400Regular,
    'BricolageGrotesque-Regular': BricolageGrotesque_400Regular,
    'BricolageGrotesque-SemiBold': BricolageGrotesque_600SemiBold,
    'BricolageGrotesque-Bold': BricolageGrotesque_700Bold,
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    Geist: Geist_400Regular,
    'Geist-Regular': Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-SemiBold': Geist_600SemiBold,
    'Geist-Bold': Geist_700Bold,
    GeistMono: GeistMono_400Regular,
    'GeistMono-Regular': GeistMono_400Regular,
    'GeistMono-Medium': GeistMono_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontsError])

  if (!fontsLoaded && !fontsError) {
    return null
  }

  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  )
}

function RootLayoutNav() {
  const { resolved, c } = useAppTheme()
  const isDark = resolved === 'dark'

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      primary: c.primary,
      notification: c.accent,
    },
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: 'BricolageGrotesque-Bold' },
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="city/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="excursion/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}
