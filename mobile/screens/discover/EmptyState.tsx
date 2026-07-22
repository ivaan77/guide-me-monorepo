import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Paragraph, SizableText, YStack } from 'tamagui'
import { CloudOff, SearchX } from '@tamagui/lucide-icons'
import { useAppTheme } from '../../providers/ThemeContext'

type NoResultsProps = {
  variant: 'no-results'
  query: string
}

type ErrorProps = {
  variant: 'error'
  message?: string
  onRetry: () => void
}

type Props = NoResultsProps | ErrorProps

export function EmptyState(props: Props) {
  const { t } = useTranslation()
  const { c } = useAppTheme()

  if (props.variant === 'no-results') {
    return (
      <YStack flex={1} items="center" justify="center" px="$6" gap="$3" pt="$10">
        <SearchX size={40} color={c.textMuted as any} />
        <SizableText size="$5" color={c.text as any} fontFamily="$body" fontWeight="600">
          {t('discover.noResultsTitle')}
        </SizableText>
        <Paragraph color={c.textMuted as any} text="center" fontFamily="$body" size="$3">
          {t('discover.noResultsBody', { query: props.query })}
        </Paragraph>
      </YStack>
    )
  }

  return (
    <YStack flex={1} items="center" justify="center" px="$6" gap="$3" pt="$10">
      <CloudOff size={40} color={c.primary as any} />
      <SizableText size="$5" color={c.text as any} fontFamily="$body" fontWeight="600">
        {t('common.somethingWentWrong')}
      </SizableText>
      <Paragraph color={c.textMuted as any} text="center" fontFamily="$body" size="$3">
        {props.message ?? t('discover.errorBody')}
      </Paragraph>
      <Pressable onPress={props.onRetry} hitSlop={8}>
        <YStack
          mt="$2"
          px="$5"
          py="$2.5"
          rounded="$5"
          bg={c.primary as any}
          borderWidth={1}
          borderColor={c.primary as any}
        >
          <SizableText size="$3" color={c.onBrand as any} fontFamily="$body" fontWeight="600">
            {t('common.tryAgain')}
          </SizableText>
        </YStack>
      </Pressable>
    </YStack>
  )
}
