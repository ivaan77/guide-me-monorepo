import { H2, Paragraph, SizableText, YStack } from 'tamagui'
import { User } from '@tamagui/lucide-icons'
import { ThemeToggle } from './ThemeToggle'

export function ProfileScreen() {
  return (
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
          Guest traveler
        </H2>
        <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
          Sign in to sync your saved cities and itineraries across devices.
        </Paragraph>
      </YStack>

      <YStack gap="$3">
        <SizableText
          size="$2"
          color="$colorPress"
          fontFamily="$body"
          fontWeight="600"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          Appearance
        </SizableText>
        <ThemeToggle />
      </YStack>
    </YStack>
  )
}
