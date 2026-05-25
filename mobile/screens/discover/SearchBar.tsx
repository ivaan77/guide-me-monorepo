import { Pressable, TextInput } from 'react-native'
import { useTranslation } from 'react-i18next'
import { XStack, YStack, useTheme } from 'tamagui'
import { Search, X } from '@tamagui/lucide-icons'

type Props = {
  value: string
  onChange: (v: string) => void
  hPadding: number
  disabled?: boolean
}

export function SearchBar({ value, onChange, hPadding, disabled }: Props) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <YStack
      bg="$background"
      pt="$2"
      pb="$2.5"
      mx={-hPadding}
      px={hPadding}
      opacity={disabled ? 0.5 : 1}
    >
      <XStack
        items="center"
        bg="$surfaceMuted"
        rounded="$5"
        px="$3"
        height={44}
        borderWidth={1}
        borderColor="$borderColor"
        gap="$2.5"
      >
        <Search size={18} color="$colorPress" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('discover.searchPlaceholder')}
          placeholderTextColor={theme.colorPress.val}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          editable={!disabled}
          style={{
            flex: 1,
            fontFamily: 'Inter',
            fontSize: 15,
            color: theme.color.val,
            paddingVertical: 0,
          }}
        />
        {value.length > 0 && !disabled && (
          <Pressable onPress={() => onChange('')} hitSlop={10}>
            <X size={16} color="$colorPress" />
          </Pressable>
        )}
      </XStack>
    </YStack>
  )
}
