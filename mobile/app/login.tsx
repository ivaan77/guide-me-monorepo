import { useCallback } from 'react'
import { Stack, useRouter, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '../providers/ThemeContext'
import { HeyLocalMark } from '../common/HeyLocalMark'
import { SocialAuthButtons } from '../common/SocialAuthButtons'
import { PRIVACY_URL, TERMS_URL } from '../config/env'

const TABS_HREF = '/(tabs)' as Href

export default function LoginScreen() {
  const { t } = useTranslation()
  const { resolved, c } = useAppTheme()
  const router = useRouter()

  const goToApp = useCallback(() => router.replace(TABS_HREF), [router])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack flex={1} bg={c.background as any} px="$6" pt="$12" pb="$8" justify="space-between">
        <YStack gap="$5" items="center" mt="$10">
          <HeyLocalMark size={88} inverse={resolved === 'dark'} />
          <SizableText
            color={c.text as any}
            fontFamily="$heading"
            fontWeight="800"
            size="$10"
            text="center"
            style={{ letterSpacing: -1.2 }}
          >
            {t('auth.titleA')}{' '}
            <SizableText
              color={c.primary as any}
              fontFamily="$heading"
              fontWeight="800"
              size="$10"
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
    </>
  )
}

