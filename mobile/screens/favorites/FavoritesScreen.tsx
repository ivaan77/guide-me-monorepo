import { H2, Paragraph, YStack } from 'tamagui'
import { Heart } from '@tamagui/lucide-icons'

export function FavoritesScreen() {
  return (
    <YStack flex={1} bg="$background" items="center" justify="center" px="$6" gap="$3">
      <Heart size={48} color="$primary" />
      <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
        No favorites yet
      </H2>
      <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
        Cities you save will show up here so you can plan your next trip.
      </Paragraph>
    </YStack>
  )
}
