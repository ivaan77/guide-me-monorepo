import { useTranslation } from 'react-i18next'
import { H2, Paragraph, YStack } from 'tamagui'
import { Heart } from '@tamagui/lucide-icons'

export function FavoritesScreen() {
  const { t } = useTranslation()
  return (
    <YStack flex={1} bg="$background" items="center" justify="center" px="$6" gap="$3">
      <Heart size={48} color="$primary" />
      <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
        {t('favorites.emptyTitle')}
      </H2>
      <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
        {t('favorites.emptyBody')}
      </Paragraph>
    </YStack>
  )
}
