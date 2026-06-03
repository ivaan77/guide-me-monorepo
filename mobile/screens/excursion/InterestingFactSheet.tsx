import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { H3, YStack } from 'tamagui'
import { AudioPlayer } from '../../common/AudioPlayer'
import { BottomSheet } from '../../common/BottomSheet'
import type { PublicInterestingFact } from '@guide-me-app/core'

const H_PADDING = 20

type Props = {
  visible: boolean
  fact: PublicInterestingFact | null
  onClose: () => void
}

export function InterestingFactSheet({ visible, fact, onClose }: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  if (!fact) return null

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.48}
      header={
        <YStack px={H_PADDING} pt="$2" pb="$3">
          <H3 fontFamily="$body" fontWeight="700" color="$color">
            {fact.title}
          </H3>
        </YStack>
      }
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack px={H_PADDING} pt="$3" gap="$3">
          <AudioPlayer
            audioUrl={fact.audioUrl}
            title={fact.title}
            promptKey="excursion.facts.sheetPrompt"
            playingKey="excursion.facts.playing"
          />
        </YStack>
      </ScrollView>
    </BottomSheet>
  )
}
