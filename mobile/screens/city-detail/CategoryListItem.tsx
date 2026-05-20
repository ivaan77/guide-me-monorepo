import { Image, Pressable } from 'react-native'
import { Link, type Href } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'
import type { PublicCategoryItem } from '@guide-me-app/core'

type Props = {
  item: PublicCategoryItem
  isLast?: boolean
  href?: string
}

export function CategoryListItem({ item, isLast, href }: Props) {
  const row = (
    <XStack
      items="center"
      px="$4"
      py="$3"
      gap="$3"
      borderBottomWidth={isLast ? 0 : 1}
      borderColor="$borderColor"
    >
      <Image
        source={{ uri: item.image }}
        style={{ width: 52, height: 52, borderRadius: 10 }}
        resizeMode="cover"
      />
      <YStack flex={1} gap="$1">
        <SizableText
          size="$4"
          fontFamily="$body"
          fontWeight="600"
          color="$color"
          numberOfLines={1}
        >
          {item.name}
        </SizableText>
        <SizableText
          size="$2"
          fontFamily="$body"
          color="$colorPress"
          numberOfLines={1}
        >
          {item.meta}
        </SizableText>
      </YStack>
    </XStack>
  )

  if (href) {
    return (
      <Link href={href as Href} asChild>
        <Pressable>{row}</Pressable>
      </Link>
    )
  }
  return <Pressable>{row}</Pressable>
}
