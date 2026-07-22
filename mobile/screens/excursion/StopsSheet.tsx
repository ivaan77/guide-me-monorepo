import { useTranslation } from 'react-i18next'
import { X } from '@tamagui/lucide-icons'
import { Pressable } from 'react-native'
import { SizableText, XStack, YStack } from 'tamagui'
import type {
  PublicExcursionStop as ExcursionStop,
  PublicPoi as Poi,
  PublicSubStop,
} from '@guide-me-app/core'
import { BottomSheet } from '../../common/BottomSheet'
import { useAppTheme } from '../../providers/ThemeContext'
import { StopsList } from './StopsList'

// Full-height sheet wrapping the existing StopsList. Replaces the previous
// in-card list slot on ExcursionScreen (where StopsList competed with the
// PhaseCard for vertical space and users could only see 1-2 stops at a
// time). The sheet gives the list its own real estate — 85% of screen
// height — so users can actually scroll and browse. Opens via the "Stops"
// chip on PhaseCardHeader; closes on backdrop tap, close button, or when
// a stop/POI row is tapped (so the user lands back on the map with the
// lightbox open, matching the old behavior).

type Props = {
  visible: boolean
  onClose: () => void
  stops: ExcursionStop[]
  pois: Poi[]
  currentIndex: number
  phase: 'preview' | 'intro' | 'navigating' | 'arrived' | 'outro' | 'complete'
  onPoiPress: (poi: Poi) => void
  onStopPress?: (stop: ExcursionStop) => void
  onSubStopPress?: (sub: PublicSubStop, parent: ExcursionStop) => void
}

export function StopsSheet({
  visible,
  onClose,
  stops,
  pois,
  currentIndex,
  phase,
  onPoiPress,
  onStopPress,
  onSubStopPress,
}: Props) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  // Wrap the item-tap handlers so tapping a row also closes the sheet.
  // This preserves the pre-refactor behavior where the list was always
  // visible: tap → lightbox/detail → back to map. Now: tap → sheet
  // closes, then the lightbox/detail behavior kicks in.
  const closeAfter =
    <T extends unknown[]>(fn?: (...args: T) => void) =>
    (...args: T) => {
      onClose()
      fn?.(...args)
    }

  return (
    <BottomSheet visible={visible} onClose={onClose} heightRatio={0.85}>
      <YStack flex={1}>
        <XStack items="center" gap="$2" px="$4" pt="$3" pb="$2">
          <SizableText
            flex={1}
            size="$6"
            fontFamily="$heading"
            fontWeight="700"
            color={c.text as any}
          >
            {t('excursion.stopsSheet.title', {
              count: stops.length,
              defaultValue: `Stops · ${stops.length}`,
            })}
          </SizableText>
          <Pressable onPress={onClose} hitSlop={8}>
            <YStack
              width={32}
              height={32}
              rounded={16}
              bg={c.surfaceMuted as any}
              items="center"
              justify="center"
            >
              <X size={16} color={c.text as any} />
            </YStack>
          </Pressable>
        </XStack>
        <YStack flex={1}>
          <StopsList
            stops={stops}
            pois={pois}
            currentIndex={currentIndex}
            phase={phase}
            onPoiPress={closeAfter(onPoiPress)}
            onStopPress={closeAfter(onStopPress)}
            onSubStopPress={closeAfter(onSubStopPress)}
          />
        </YStack>
      </YStack>
    </BottomSheet>
  )
}
