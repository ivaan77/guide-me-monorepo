import { Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import type { PublicCity } from '@guide-me-app/core'
import { SizableText, XStack, YStack } from 'tamagui'
import { RatingStars } from '../../common/RatingStars'
import { useAppTheme } from '../../providers/ThemeContext'

type Props = {
  city: PublicCity
  width: number
}

export function CityCard({ city, width }: Props) {
  const { c } = useAppTheme()
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
            style={{ width: '100%', height: width * 1.15 }}
            resizeMode="cover"
          />
          <YStack items="center" justify="center" py="$3" px="$2">
            <SizableText
              size="$5"
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
              {city.rating && city.rating.count > 0 ? (
                <RatingStars mode="display" aggregate={city.rating} compact />
              ) : null}
            </XStack>
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  )
}
