import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { AppProvider } from '../providers/AppProvider'
import { useAppTheme } from '../providers/ThemeContext'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    InterMedium: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterSemiBold: require('@tamagui/font-inter/otf/Inter-SemiBold.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (interLoaded || interError) {
      SplashScreen.hideAsync()
    }
  }, [interLoaded, interError])

  if (!interLoaded && !interError) {
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
          headerTitleStyle: { fontFamily: 'InterSemiBold' },
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
