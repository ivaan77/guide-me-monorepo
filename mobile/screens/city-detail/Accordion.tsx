import { type ComponentType, type ReactNode, useState } from 'react'
import { LayoutAnimation, Platform, Pressable, UIManager } from 'react-native'
import { ChevronDown } from '@tamagui/lucide-icons'
import type { IconProps } from '@tamagui/helpers-icon'
import { SizableText, XStack, YStack } from 'tamagui'
import { useAppTheme } from '../../providers/ThemeContext'

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
  const { c } = useAppTheme()

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((prev) => !prev)
  }

  return (
    <YStack
      bg={c.surface as any}
      rounded="$5"
      borderWidth={1}
      borderColor={c.border as any}
      overflow="hidden"
    >
      <Pressable onPress={toggle}>
        <XStack items="center" px="$4" py="$3.5" gap="$3">
          <YStack
            width={32}
            height={32}
            rounded={16}
            bg={c.surfaceMuted as any}
            items="center"
            justify="center"
          >
            <Icon size={16} color={c.primary as any} />
          </YStack>
          <SizableText
            flex={1}
            size="$5"
            fontFamily="$body"
            fontWeight="600"
            color={c.text as any}
          >
            {title}
          </SizableText>
          {typeof count === 'number' && (
            <SizableText
              size="$3"
              fontFamily="$body"
              color={c.textMuted as any}
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
            <ChevronDown size={18} color={c.textMuted as any} />
          </YStack>
        </XStack>
      </Pressable>
      {open && <YStack borderTopWidth={1} borderColor={c.border as any}>{children}</YStack>}
    </YStack>
  )
}
