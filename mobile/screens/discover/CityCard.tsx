import { Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import type { PublicCity } from '@guide-me-app/core'
import { SizableText, XStack, YStack } from 'tamagui'
import { RatingStars } from '../../common/RatingStars'

type Props = {
  city: PublicCity
  width: number
}

export function CityCard({ city, width }: Props) {
  return (
    <Link href={`/city/${city.id}`} asChild>
      <Pressable style={{ width }}>
        <YStack
          bg="$surface"
          rounded="$6"
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
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
              color="$color"
              text="center"
              numberOfLines={1}
            >
              {city.name}
            </SizableText>
            <SizableText
              size="$2"
              fontFamily="$body"
              color="$colorPress"
              text="center"
              mt="$0.5"
              numberOfLines={1}
            >
              {city.country}
            </SizableText>
            {city.rating && city.rating.count > 0 && (
              <XStack mt="$1.5" justify="center">
                <RatingStars mode="display" aggregate={city.rating} compact />
              </XStack>
            )}
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  )
}
