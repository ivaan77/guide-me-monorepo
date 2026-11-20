import { Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import type { PublicCity } from '@guide-me-app/core'
import { SizableText, XStack, YStack } from 'tamagui'
import { RatingStars } from '../../common/RatingStars'
import { CITY_CARD_RATIO } from '../../constants/Sizes'
import { useLayout } from '../../hooks/useLayout'
import { useAppTheme } from '../../providers/ThemeContext'

type Props = {
  city: PublicCity
  width: number
}

export function CityCard({ city, width }: Props) {
  const { c } = useAppTheme()
  const { isSmall } = useLayout()
  return (
    <Link href={`/city/${city.id}`} asChild>
      <Pressable style={{ width }}>
        <YStack
          bg={c.surface as any}
          rounded="$6"
          overflow="hidden"
          borderWidth={1}
          borderColor={c.border as any}
        >
          <Image
            source={{ uri: city.image }}
            style={{
              width: '100%',
              height:
                width *
                (isSmall ? CITY_CARD_RATIO.small : CITY_CARD_RATIO.default),
            }}
            resizeMode="cover"
          />
          <YStack items="center" justify="center" py="$3" px="$2">
            <SizableText
              size={isSmall ? '$4' : '$5'}
              fontFamily="$body"
              fontWeight="600"
              color={c.text as any}
              text="center"
              numberOfLines={1}
            >
              {city.name}
            </SizableText>
            <SizableText
              size="$2"
              fontFamily="$body"
              color={c.textMuted as any}
              text="center"
              mt="$0.5"
              numberOfLines={1}
            >
              {city.country}
            </SizableText>
            <XStack mt="$1.5" justify="center" minH={20}>
              <RatingStars
                mode="display"
                aggregate={city.rating}
                compact
                showEmptyState
              />
            </XStack>
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  )
}
