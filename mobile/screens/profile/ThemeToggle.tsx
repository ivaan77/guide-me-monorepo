import { Pressable } from 'react-native'
import { SizableText, XStack } from 'tamagui'
import { Monitor, Moon, Sun } from '@tamagui/lucide-icons'
import { type ThemeMode, useAppTheme } from '../../providers/ThemeContext'

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

export function ThemeToggle() {
  const { mode, setMode } = useAppTheme()

  return (
    <XStack
      bg="$surfaceMuted"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      p="$1"
      gap="$1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value
        return (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            style={{ flex: 1 }}
          >
            <XStack
              flex={1}
              items="center"
              justify="center"
              gap="$2"
              py="$2.5"
              rounded="$4"
              bg={active ? '$surface' : 'transparent'}
              borderWidth={active ? 1 : 0}
              borderColor="$borderColor"
            >
              <Icon size={16} color={active ? '$primary' : '$colorPress'} />
              <SizableText
                size="$3"
                fontFamily="$body"
                fontWeight={active ? '600' : '500'}
                color={active ? '$color' : '$colorPress'}
              >
                {label}
              </SizableText>
            </XStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
