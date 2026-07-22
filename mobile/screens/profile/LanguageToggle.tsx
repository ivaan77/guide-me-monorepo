import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SizableText, XStack } from 'tamagui'
import { Globe } from '@tamagui/lucide-icons'
import {
  type LanguageMode,
  useAppLanguage,
} from '../../providers/LanguageContext'
import { useAppTheme } from '../../providers/ThemeContext'

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
  const { c } = useAppTheme()

  return (
    <XStack
      bg={c.surfaceMuted as any}
      rounded="$5"
      borderWidth={1}
      borderColor={c.border as any}
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
              bg={(active ? c.surface : 'transparent') as any}
              borderWidth={active ? 1 : 0}
              borderColor={c.border as any}
            >
              {isSystem ? (
                <Globe size={16} color={(active ? c.primary : c.textMuted) as any} />
              ) : (
                <SizableText size="$4">{opt.flag}</SizableText>
              )}
              <SizableText
                size="$3"
                fontFamily="$body"
                fontWeight={active ? '600' : '500'}
                color={(active ? c.text : c.textMuted) as any}
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
