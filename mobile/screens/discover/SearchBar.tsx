import { Pressable, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { XStack, YStack } from 'tamagui'
import { Search, X } from '@tamagui/lucide-icons'
import { useAppTheme } from '../../providers/ThemeContext'

type Props = {
  value: string
  onChange: (v: string) => void
  hPadding: number
  disabled?: boolean
}

export function SearchBar({ value, onChange, hPadding, disabled }: Props) {
  const { c } = useAppTheme()
  const { t } = useTranslation()
  return (
    <YStack
      bg={c.background as any}
      pt="$2"
      pb="$2.5"
      mx={-hPadding}
      px={hPadding}
      opacity={disabled ? 0.5 : 1}
    >
      <XStack
        items="center"
        bg={c.surfaceMuted as any}
        rounded="$5"
        px="$3"
        height={44}
        borderWidth={1}
        borderColor={c.border as any}
        gap="$2.5"
      >
        <Search size={18} color={c.textMuted as any} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('discover.searchPlaceholder')}
          placeholderTextColor={c.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          editable={!disabled}
          style={{
            flex: 1,
            fontFamily: 'Geist',
            fontSize: 15,
            color: c.text,
            paddingVertical: 0,
          }}
        />
        {value.length > 0 && !disabled && (
          <Pressable onPress={() => onChange('')} hitSlop={10}>
            <X size={16} color={c.textMuted as any} />
          </Pressable>
        )}
      </XStack>
    </YStack>
  )
}
