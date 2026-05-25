import { useEffect, useMemo, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useRouter, useSegments, type Href } from 'expo-router'
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
import { useAuth } from '@clerk/clerk-expo'
import { AppProvider } from '../providers/AppProvider'
import { useAppTheme } from '../providers/ThemeContext'
import { readAuthChoice } from '../providers/AuthChoice'
import { OfflineBanner } from '../common/OfflineBanner'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
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
      <AuthGate>
        <RootLayoutNav />
      </AuthGate>
    </AppProvider>
  )
}

// Once on first launch, if Clerk doesn't already have a signed-in session and
// the user hasn't picked "skip" before, push them to /login. Choice persists
// in AsyncStorage so this only fires once per install.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [decision, setDecision] = useState<'pending' | 'allow'>('pending')

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    ;(async () => {
      const choice = await readAuthChoice()
      if (cancelled) return
      const onLoginRoute = (segments[0] as string) === 'login'
      if (!isSignedIn && !choice && !onLoginRoute) {
        router.replace('/login' as Href)
      }
      setDecision('allow')
    })()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, segments, router])

  if (!isLoaded || decision === 'pending') return null
  return <>{children}</>
}

function RootLayoutNav() {
  const { resolved, c } = useAppTheme()
  const isDark = resolved === 'dark'

  // Stable reference per resolved theme. Without `useMemo`, every render of
  // RootLayoutNav creates a new `navTheme` object — React Navigation sees
  // it as a "changed theme" each time and re-applies it across the whole
  // tab bar, which causes the active/inactive tint to flash whenever you
  // switch tabs (every focus event triggers a render in this subtree).
  const navTheme = useMemo(
    () => ({
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
    }),
    [isDark, c.background, c.text, c.border, c.primary, c.accent],
  )

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: 'BricolageGrotesque-Bold' },
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="city/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="excursion/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}
