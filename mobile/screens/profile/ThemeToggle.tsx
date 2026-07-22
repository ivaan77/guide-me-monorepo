import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SizableText, XStack } from 'tamagui'
import { Monitor, Moon, Sun } from '@tamagui/lucide-icons'
import { type ThemeMode, useAppTheme } from '../../providers/ThemeContext'

const OPTIONS: {
  value: ThemeMode
  labelKey: 'profile.themeSystem' | 'profile.themeLight' | 'profile.themeDark'
  Icon: typeof Sun
}[] = [
  { value: 'system', labelKey: 'profile.themeSystem', Icon: Monitor },
  { value: 'light', labelKey: 'profile.themeLight', Icon: Sun },
  { value: 'dark', labelKey: 'profile.themeDark', Icon: Moon },
]

export function ThemeToggle() {
  const { t } = useTranslation()
  const { mode, setMode, c } = useAppTheme()

  return (
    <XStack
      bg={c.surfaceMuted as any}
      rounded="$5"
      borderWidth={1}
      borderColor={c.border as any}
      p="$1"
      gap="$1"
    >
      {OPTIONS.map(({ value, labelKey, Icon }) => {
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
              bg={(active ? c.surface : 'transparent') as any}
              borderWidth={active ? 1 : 0}
              borderColor={c.border as any}
            >
              <Icon size={16} color={(active ? c.primary : c.textMuted) as any} />
              <SizableText
                size="$3"
                fontFamily="$body"
                fontWeight={active ? '600' : '500'}
                color={(active ? c.text : c.textMuted) as any}
              >
                {t(labelKey)}
              </SizableText>
            </XStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
