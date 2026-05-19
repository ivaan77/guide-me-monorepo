import { type ComponentType, type ReactNode, useState } from 'react'
import { LayoutAnimation, Platform, Pressable, UIManager } from 'react-native'
import { ChevronDown } from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import { SizableText, XStack, YStack } from 'tamagui'

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type Props = {
  title: string
  icon: ComponentType<IconProps>
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

export function Accordion({
  title,
  icon: Icon,
  count,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((prev) => !prev)
  }

  return (
    <YStack
      bg="$surface"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
    >
      <Pressable onPress={toggle}>
        <XStack items="center" px="$4" py="$3.5" gap="$3">
          <YStack
            width={32}
            height={32}
            rounded={16}
            bg="$surfaceMuted"
            items="center"
            justify="center"
          >
            <Icon size={16} color="$primary" />
          </YStack>
          <SizableText
            flex={1}
            size="$5"
            fontFamily="$body"
            fontWeight="600"
            color="$color"
          >
            {title}
          </SizableText>
          {typeof count === 'number' && (
            <SizableText
              size="$3"
              fontFamily="$body"
              color="$colorPress"
              mr="$2"
            >
              {count}
            </SizableText>
          )}
          <YStack
            style={{
              transform: [{ rotate: open ? '180deg' : '0deg' }],
            }}
          >
            <ChevronDown size={18} color="$colorPress" />
          </YStack>
        </XStack>
      </Pressable>
      {open && <YStack borderTopWidth={1} borderColor="$borderColor">{children}</YStack>}
    </YStack>
  )
}
