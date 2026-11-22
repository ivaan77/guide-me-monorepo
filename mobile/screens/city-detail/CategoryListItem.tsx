import { type ReactNode } from 'react'
import { Image, Pressable } from 'react-native'
import { Link, type Href } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'
import type { PublicCategoryItem } from '@guide-me-app/core'
import { RatingStars } from '../../common/RatingStars'
import { useAppTheme } from '../../providers/ThemeContext'
import { useLayout } from '../../hooks/useLayout'

type Props = {
  item: PublicCategoryItem
  isLast?: boolean
  href?: string
  // Optional right-side chip rendered next to the item name. Used by the
  // excursions section to show a today-weather badge; other categories
  // pass nothing and the row keeps its original layout.
  trailingBadge?: ReactNode
}

export function CategoryListItem({ item, isLast, href, trailingBadge }: Props) {
  const { c } = useAppTheme()
  const { isSmall } = useLayout()
  const row = (
    <XStack
      items="center"
      px={isSmall ? "$3" : "$4"}
      py={isSmall ? "$2.5" : "$3"}
      gap="$3"
      borderBottomWidth={isLast ? 0 : 1}
      borderColor={c.border as any}
    >
      <Image
        source={{ uri: item.image }}
        style={{
          width: isSmall ? 44 : 52,
          height: isSmall ? 44 : 52,
          borderRadius: 10,
        }}
        resizeMode="cover"
      />
      <YStack flex={1} gap="$1">
        <XStack items="center" gap="$2">
          <SizableText
            size="$4"
            fontFamily="$body"
            fontWeight="600"
            color={c.text as any}
            numberOfLines={1}
            flex={1}
          >
            {item.name}
          </SizableText>
          {trailingBadge}
        </XStack>
        <XStack items="flex-start" gap="$2">
          <SizableText
            size="$2"
            fontFamily="$body"
            color={c.textMuted as any}
            numberOfLines={isSmall ? 2 : 1}
            flex={1}
          >
            {item.meta}
          </SizableText>
          {item.rating && item.rating.count > 0 && (
            <RatingStars mode="display" aggregate={item.rating} compact />
          )}
        </XStack>
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
