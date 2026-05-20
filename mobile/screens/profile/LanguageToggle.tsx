import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SizableText, XStack, YStack } from 'tamagui'
import { Globe } from '@tamagui/lucide-icons'
import {
  type LanguageMode,
  useAppLanguage,
} from '../../providers/LanguageContext'

type Option = {
  value: LanguageMode
  flag: string
  shortLabel: string
}

const OPTIONS: Option[] = [
  { value: 'system', flag: '', shortLabel: 'system' },
  { value: 'en', flag: '🇬🇧', shortLabel: 'EN' },
  { value: 'de', flag: '🇩🇪', shortLabel: 'DE' },
  { value: 'hr', flag: '🇭🇷', shortLabel: 'HR' },
]

export function LanguageToggle() {
  const { t } = useTranslation()
  const { mode, setMode } = useAppLanguage()

  return (
    <XStack
      bg="$surfaceMuted"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      p="$1"
      gap="$1"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value
        const isSystem = opt.value === 'system'
        return (
          <Pressable
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={{ flex: 1 }}
          >
            <XStack
              flex={1}
              items="center"
              justify="center"
              gap="$1.5"
              py="$2.5"
              rounded="$4"
              bg={active ? '$surface' : 'transparent'}
              borderWidth={active ? 1 : 0}
              borderColor="$borderColor"
            >
              {isSystem ? (
                <Globe size={16} color={active ? '$primary' : '$colorPress'} />
              ) : (
                <SizableText size="$4">{opt.flag}</SizableText>
              )}
              <SizableText
                size="$3"
                fontFamily="$body"
                fontWeight={active ? '600' : '500'}
                color={active ? '$color' : '$colorPress'}
              >
                {isSystem ? t('profile.languageSystem') : opt.shortLabel}
              </SizableText>
            </XStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
