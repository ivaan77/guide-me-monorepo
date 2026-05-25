import { useCallback } from 'react'
import { Stack, useRouter, type Href } from 'expo-router'
import { Paragraph, SizableText, YStack } from 'tamagui'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '../providers/ThemeContext'
import { SocialAuthButtons } from '../common/SocialAuthButtons'

const TABS_HREF = '/(tabs)' as Href

export default function LoginScreen() {
  const { t } = useTranslation()
  const { resolved } = useAppTheme()
  const router = useRouter()

  const goToApp = useCallback(() => router.replace(TABS_HREF), [router])
  const stroke = resolved === 'dark' ? '#F5F7FA' : '#0B1F3A'

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack flex={1} bg="$background" px="$6" pt="$12" pb="$8" justify="space-between">
        <YStack gap="$5" items="center" mt="$10">
          <Mark size={88} stroke={stroke} />
          <SizableText
            color="$color"
            fontFamily="$heading"
            fontWeight="800"
            size="$10"
            text="center"
            style={{ letterSpacing: -1.2 }}
          >
            {t('auth.titleA')}{' '}
            <SizableText
              color="$primary"
              fontFamily="$heading"
              fontWeight="800"
              size="$10"
            >
              {t('auth.titleB')}
            </SizableText>
          </SizableText>
          <Paragraph color="$colorPress" text="center" size="$4" max-width={320}>
            {t('auth.subtitle')}
          </Paragraph>
        </YStack>

        <SocialAuthButtons onSignedIn={goToApp} onSkip={goToApp} />
      </YStack>
    </>
  )
}

function Mark({ size, stroke }: { size: number; stroke: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M10 50 C 22 50, 30 46, 36 34 S 46 14, 54 14"
        stroke={stroke}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={54} cy={14} r={6.5} fill="#FFB23F" />
      <Circle cx={10} cy={50} r={2.5} fill={stroke} opacity={0.85} />
    </Svg>
  )
}
