import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, ScrollView, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'
import { Button, H2, Paragraph, SizableText, YStack } from 'tamagui'
import { ExternalLink, LogOut, Trash2, User } from '@tamagui/lucide-icons'
import { LanguageToggle } from './LanguageToggle'
import { useLayout } from '../../hooks/useLayout'
import { TABLET_MAX_CONTENT_WIDTH } from '../../constants/Sizes'
import { ThemeToggle } from './ThemeToggle'
import { clearAuthChoice, writeAuthChoice } from '../../providers/AuthChoice'
import { useAppTheme } from '../../providers/ThemeContext'
import { useTabBarPadding } from '../../hooks/useTabBarPadding'
import { useDeleteAccount } from '../../hooks/useDeleteAccount'
import { palette } from '../../constants/Colors'
import { PRIVACY_URL, TERMS_URL } from '../../config/env'

export function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const { c } = useAppTheme()
  const insets = useSafeAreaInsets()
  const bottomPadding = useTabBarPadding()
  const deleteAccount = useDeleteAccount()
  const { isTablet } = useLayout()

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

  const openTerms = useCallback(() => {
    WebBrowser.openBrowserAsync(TERMS_URL).catch(() => {})
  }, [])

  const openPrivacy = useCallback(() => {
    WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {})
  }, [])

  const onDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccountConfirmTitle'),
      t('profile.deleteAccountConfirmMessage'),
      [
        { text: t('profile.deleteAccountCancel'), style: 'cancel' },
        {
          text: t('profile.deleteAccountConfirmAction'),
          style: 'destructive',
          onPress: () => {
            deleteAccount.mutate(undefined, {
              onError: () => {
                Alert.alert(
                  t('profile.deleteAccountErrorTitle'),
                  t('profile.deleteAccountErrorMessage'),
                )
              },
            })
          },
        },
      ],
    )
  }, [deleteAccount, t])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingBottom: bottomPadding,
        backgroundColor: c.background,
        alignItems: isTablet ? 'center' : 'stretch',
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack
        flex={1}
        bg={c.background as any}
        px="$5"
        pt={insets.top + 24}
        gap="$6"
        style={
          isTablet
            ? { width: '100%', maxWidth: TABLET_MAX_CONTENT_WIDTH }
            : undefined
        }
      >
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
              bg={c.surfaceMuted as any}
              borderWidth={1}
              borderColor={c.border as any}
              items="center"
              justify="center"
            >
              <User size={40} color={c.primary as any} />
            </YStack>
          )}
          <H2 color={c.text as any} fontFamily="$body" fontWeight="600" fontSize="$8">
            {isSignedIn ? displayName ?? t('profile.guestName') : t('profile.guestName')}
          </H2>
          {!isSignedIn && (
            <>
              <Paragraph color={c.textMuted as any} text="center" fontFamily="$body" size="$4">
                {t('profile.signInPrompt')}
              </Paragraph>
              <Button
                size="$4"
                bg={c.primary as any}
                color={c.onBrand as any}
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
              icon={<LogOut size={16} color={c.textMuted as any} />}
              color={c.textMuted as any}
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

        <Section title={t('profile.legal')}>
          <YStack gap="$2">
            <Button
              size="$4"
              chromeless
              justify="flex-start"
              icon={<ExternalLink size={16} color={c.text as any} />}
              color={c.text as any}
              fontFamily="$body"
              fontWeight="500"
              onPress={openTerms}
            >
              {t('profile.terms')}
            </Button>
            <Button
              size="$4"
              chromeless
              justify="flex-start"
              icon={<ExternalLink size={16} color={c.text as any} />}
              color={c.text as any}
              fontFamily="$body"
              fontWeight="500"
              onPress={openPrivacy}
            >
              {t('profile.privacy')}
            </Button>
          </YStack>
        </Section>

        {isSignedIn && (
          <Section title={t('profile.account')}>
            <Button
              size="$4"
              chromeless
              icon={<Trash2 size={16} color={palette.danger as any} />}
              fontFamily="$body"
              fontWeight="600"
              disabled={deleteAccount.isPending}
              onPress={onDeleteAccount}
              style={{ color: palette.danger }}
            >
              {t('profile.deleteAccount')}
            </Button>
          </Section>
        )}
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
  const { c } = useAppTheme()
  return (
    <YStack gap="$3">
      <SizableText
        size="$2"
        color={c.textMuted as any}
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
