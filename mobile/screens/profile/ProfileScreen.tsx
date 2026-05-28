import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Button, H2, Paragraph, SizableText, YStack } from 'tamagui'
import { LogOut, User } from '@tamagui/lucide-icons'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { clearAuthChoice, writeAuthChoice } from '../../providers/AuthChoice'
import { useAppTheme } from '../../providers/ThemeContext'
import { useTabBarPadding } from '../../hooks/useTabBarPadding'

export function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const { c } = useAppTheme()
  const insets = useSafeAreaInsets()
  const bottomPadding = useTabBarPadding()

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress

  const onSignIn = useCallback(async () => {
    await clearAuthChoice()
    router.push('/login' as Href)
  }, [router])

  const onSignOut = useCallback(async () => {
    // Treat sign-out as an explicit "continue as guest" choice. Without
    // this the AuthGate would immediately route back to /login since the
    // user is no longer signed-in and has no stored choice.
    await writeAuthChoice('skipped')
    await signOut()
  }, [signOut])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: bottomPadding, backgroundColor: c.background }}
      showsVerticalScrollIndicator={false}
    >
      <YStack flex={1} bg="$background" px="$5" pt={insets.top + 24} gap="$6">
        <YStack items="center" gap="$3">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
            />
          ) : (
            <YStack
              width={88}
              height={88}
              rounded={44}
              bg="$surfaceMuted"
              borderWidth={1}
              borderColor="$borderColor"
              items="center"
              justify="center"
            >
              <User size={40} color="$primary" />
            </YStack>
          )}
          <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
            {isSignedIn ? displayName ?? t('profile.guestName') : t('profile.guestName')}
          </H2>
          {!isSignedIn && (
            <>
              <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
                {t('profile.signInPrompt')}
              </Paragraph>
              <Button
                size="$4"
                bg="$primary"
                color="$background"
                fontFamily="$heading"
                fontWeight="700"
                onPress={onSignIn}
              >
                {t('profile.signIn')}
              </Button>
            </>
          )}
          {isSignedIn && (
            <Button
              size="$4"
              chromeless
              icon={<LogOut size={16} />}
              color="$colorPress"
              fontFamily="$body"
              fontWeight="500"
              onPress={onSignOut}
            >
              {t('profile.signOut')}
            </Button>
          )}
        </YStack>

        <Section title={t('profile.appearance')}>
          <ThemeToggle />
        </Section>

        <Section title={t('profile.language')}>
          <LanguageToggle />
        </Section>
      </YStack>
    </ScrollView>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <YStack gap="$3">
      <SizableText
        size="$2"
        color="$colorPress"
        fontFamily="$body"
        fontWeight="600"
        style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {title}
      </SizableText>
      {children}
    </YStack>
  )
}
