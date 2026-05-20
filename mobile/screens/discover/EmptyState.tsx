import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Paragraph, SizableText, YStack } from 'tamagui'
import { CloudOff, SearchX } from '@tamagui/lucide-icons'

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

  if (props.variant === 'no-results') {
    return (
      <YStack flex={1} items="center" justify="center" px="$6" gap="$3" pt="$10">
        <SearchX size={40} color="$colorPress" />
        <SizableText size="$5" color="$color" fontFamily="$body" fontWeight="600">
          {t('discover.noResultsTitle')}
        </SizableText>
        <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$3">
          {t('discover.noResultsBody', { query: props.query })}
        </Paragraph>
      </YStack>
    )
  }

  return (
    <YStack flex={1} items="center" justify="center" px="$6" gap="$3" pt="$10">
      <CloudOff size={40} color="$primary" />
      <SizableText size="$5" color="$color" fontFamily="$body" fontWeight="600">
        {t('common.somethingWentWrong')}
      </SizableText>
      <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$3">
        {props.message ?? t('discover.errorBody')}
      </Paragraph>
      <Pressable onPress={props.onRetry} hitSlop={8}>
        <YStack
          mt="$2"
          px="$5"
          py="$2.5"
          rounded="$5"
          bg="$primary"
          borderWidth={1}
          borderColor="$primary"
        >
          <SizableText size="$3" color="$background" fontFamily="$body" fontWeight="600">
            {t('common.tryAgain')}
          </SizableText>
        </YStack>
      </Pressable>
    </YStack>
  )
}
