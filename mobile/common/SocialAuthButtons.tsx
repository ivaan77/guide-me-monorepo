import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { useSSO, useSignInWithApple } from '@clerk/clerk-expo'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Apple } from '@tamagui/lucide-icons'
import { Button, Spinner, YStack } from 'tamagui'
import Svg, { Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { writeAuthChoice } from '../providers/AuthChoice'

type Props = {
  // Called after Clerk session is set. The /login full-screen passes a
  // router.replace('/(tabs)') here; the prompt sheet uses it to close itself.
  onSignedIn?: () => void
  // Optional "Continue without signing in" link rendered below the social
  // buttons. The login screen sets a router.replace, the prompt sheet hides
  // this link entirely.
  onSkip?: () => void
}

export function SocialAuthButtons({ onSignedIn, onSkip }: Props) {
  const { t } = useTranslation()
  const { startSSOFlow } = useSSO()
  const { startAppleAuthenticationFlow } = useSignInWithApple()
  const [appleAvailable, setAppleAvailable] = useState(false)
  const [pending, setPending] = useState<null | 'google' | 'apple' | 'skip'>(null)

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setAppleAvailable(false)
      return
    }
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false))
  }, [])

  const onGoogle = useCallback(async () => {
    if (pending) return
    setPending('google')
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        await writeAuthChoice('signed-in')
        onSignedIn?.()
      }
    } catch (err) {
      Alert.alert(
        t('auth.signInFailedTitle'),
        err instanceof Error ? err.message : String(err),
      )
    } finally {
      setPending(null)
    }
  }, [pending, startSSOFlow, onSignedIn, t])

  const onApple = useCallback(async () => {
    if (pending) return
    setPending('apple')
    try {
      const { createdSessionId, setActive } = await startAppleAuthenticationFlow()
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        await writeAuthChoice('signed-in')
        onSignedIn?.()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!/canceled|cancelled/i.test(msg)) {
        Alert.alert(t('auth.signInFailedTitle'), msg)
      }
    } finally {
      setPending(null)
    }
  }, [pending, startAppleAuthenticationFlow, onSignedIn, t])

  const onSkipPress = useCallback(async () => {
    setPending('skip')
    await writeAuthChoice('skipped')
    onSkip?.()
  }, [onSkip])

  return (
    <YStack gap="$3">
      <Button
        size="$5"
        bg="$primary"
        color="$background"
        fontFamily="$heading"
        fontWeight="700"
        disabled={!!pending}
        onPress={onGoogle}
        icon={pending === 'google' ? <Spinner color="$background" /> : <GoogleG />}
      >
        {t('auth.continueWithGoogle')}
      </Button>

      {appleAvailable && (
        <Button
          size="$5"
          bg="$color"
          color="$background"
          fontFamily="$heading"
          fontWeight="700"
          disabled={!!pending}
          onPress={onApple}
          icon={pending === 'apple' ? <Spinner color="$background" /> : <Apple size={20} color="$background" />}
        >
          {t('auth.continueWithApple')}
        </Button>
      )}

      {onSkip && (
        <Button
          size="$5"
          chromeless
          color="$colorPress"
          fontFamily="$body"
          fontWeight="500"
          disabled={!!pending}
          onPress={onSkipPress}
          icon={pending === 'skip' ? <Spinner /> : undefined}
        >
          {t('auth.skip')}
        </Button>
      )}
    </YStack>
  )
}

// Multi-colored Google "G" glyph, drawn as a small SVG to avoid bringing in
// a brand-asset dependency.
function GoogleG() {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.838.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <Path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </Svg>
  )
}
