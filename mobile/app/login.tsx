import { useCallback } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, useRouter, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { useLayout } from '../hooks/useLayout'
import { useAppTheme } from '../providers/ThemeContext'
import { HeyLocalMark } from '../common/HeyLocalMark'
import { SocialAuthButtons } from '../common/SocialAuthButtons'
import { PRIVACY_URL, TERMS_URL } from '../config/env'

const TABS_HREF = '/(tabs)' as Href

export default function LoginScreen() {
  const { t } = useTranslation()
  const { resolved, c } = useAppTheme()
  const { isSmall } = useLayout()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const goToApp = useCallback(() => router.replace(TABS_HREF), [router])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Scrollable: on an iPhone SE (667pt tall) the mark + 3-line title +
          two auth buttons + the guest link + legal text do not fit, and the
          guest link is the only way into the app without an account. The
          stack keeps `justify-between` on roomy screens via flexGrow, and
          becomes scrollable the moment it would overflow. */}
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingTop: insets.top + (isSmall ? 16 : 48),
          paddingBottom: insets.bottom + (isSmall ? 20 : 32),
        }}
        showsVerticalScrollIndicator={false}
      >
      <YStack flex={1} px="$6" justify="space-between">
        <YStack gap={isSmall ? '$3' : '$5'} items="center" mt={isSmall ? '$2' : '$10'}>
          <HeyLocalMark size={isSmall ? 64 : 88} inverse={resolved === 'dark'} />
          <SizableText
            color={c.text as any}
            fontFamily="$heading"
            fontWeight="800"
            size={isSmall ? '$8' : '$10'}
            text="center"
            style={{ letterSpacing: -1.2 }}
          >
            {t('auth.titleA')}{' '}
            <SizableText
              color={c.primary as any}
              fontFamily="$heading"
              fontWeight="800"
              size={isSmall ? '$8' : '$10'}
            >
              {t('auth.titleB')}
            </SizableText>
          </SizableText>
          <Paragraph color={c.textMuted as any} text="center" size="$4" max-width={320}>
            {t('auth.subtitle')}
          </Paragraph>
        </YStack>

        <YStack gap="$4">
          <SocialAuthButtons onSignedIn={goToApp} onSkip={goToApp} />
          <XStack justify="center" flexWrap="wrap" gap="$1">
            <SizableText color={c.textMuted as any} size="$2" fontFamily="$body">
              {t('auth.legalNoticeBefore')}{' '}
            </SizableText>
            <SizableText
              color={c.primary as any}
              size="$2"
              fontFamily="$body"
              fontWeight="600"
              onPress={() => WebBrowser.openBrowserAsync(TERMS_URL).catch(() => {})}
            >
              {t('profile.terms')}
            </SizableText>
            <SizableText color={c.textMuted as any} size="$2" fontFamily="$body">
              {' '}{t('auth.legalNoticeAnd')}{' '}
            </SizableText>
            <SizableText
              color={c.primary as any}
              size="$2"
              fontFamily="$body"
              fontWeight="600"
              onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {})}
            >
              {t('profile.privacy')}
            </SizableText>
            <SizableText color={c.textMuted as any} size="$2" fontFamily="$body">.</SizableText>
          </XStack>
        </YStack>
      </YStack>
      </ScrollView>
    </>
  )
}

