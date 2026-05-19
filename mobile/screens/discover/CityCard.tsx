import { Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { SizableText, YStack } from 'tamagui'
import type { City } from '../../data/cities'

type Props = {
  city: City
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
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  )
}
