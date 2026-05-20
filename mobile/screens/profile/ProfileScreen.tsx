import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { H2, Paragraph, SizableText, YStack } from 'tamagui'
import { User } from '@tamagui/lucide-icons'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'

export function ProfileScreen() {
  const { t } = useTranslation()
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 64 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack flex={1} bg="$background" px="$5" pt="$6" gap="$6">
        <YStack items="center" gap="$3">
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
          <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
            {t('profile.guestName')}
          </H2>
          <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
            {t('profile.signInPrompt')}
          </Paragraph>
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
