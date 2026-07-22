import { useTranslation } from 'react-i18next'
import { FlatList, Image, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, MapPin } from '@tamagui/lucide-icons'
import { H3, SizableText, XStack, YStack } from 'tamagui'
import { BottomSheet } from '../../common/BottomSheet'
import { palette } from '../../constants/Colors'
import { useAppTheme } from '../../providers/ThemeContext'
import type { PublicExcursionStop } from '@guide-me-app/core'

const H_PADDING = 20
// Navy reads cleanly on the amber accent — same pairing used by the
// fact banner/player and the NearestStopCallout marker. Keeping it
// consistent so the "Nearest" affordance has the same visual signature
// wherever it shows up.
const ON_ACCENT = palette.navy

type Props = {
  visible: boolean
  stops: PublicExcursionStop[]
  selectedIndex: number
  // Index of the stop closest to the user, or null if GPS not available.
  // Renders an emphasized "Nearest" treatment on this row.
  nearestIndex: number | null
  onSelect: (index: number) => void
  onClose: () => void
}

// Bottom-sheet picker for the "Starting from" chip on the preview panel.
// The nearest row is styled to dominate the list: amber accent stripe down
// the left edge, tinted background, prominent "Nearest" pill with caption,
// so users immediately understand which row is the system's suggestion.
export function StartFromPicker({
  visible,
  stops,
  selectedIndex,
  nearestIndex,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { c } = useAppTheme()

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.75}
      header={
        <YStack px={H_PADDING} pt="$2" pb="$3">
          <H3 fontFamily="$body" fontWeight="700" color={c.text as any}>
            {t('excursion.startFrom.pickerTitle', {
              defaultValue: 'Choose starting stop',
            })}
          </H3>
        </YStack>
      }
    >
      <FlatList
        data={stops}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <StopRow
            stop={item}
            index={index}
            selected={index === selectedIndex}
            nearest={index === nearestIndex}
            onPress={() => {
              onSelect(index)
              onClose()
            }}
          />
        )}
      />
    </BottomSheet>
  )
}

function StopRow({
  stop,
  index,
  selected,
  nearest,
  onPress,
}: {
  stop: PublicExcursionStop
  index: number
  selected: boolean
  nearest: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  return (
    <Pressable onPress={onPress}>
      <XStack
        items="stretch"
        gap={0}
        // Nearest row uses a soft amber tint (no Tamagui token for this —
        // reads as a faint warm wash on both light and dark surfaces).
        // Selected-but-not-nearest gets the standard surfaceMuted token.
        bg={
          (nearest
            ? 'transparent'
            : selected
              ? c.surfaceMuted
              : 'transparent') as any
        }
        style={
          nearest ? { backgroundColor: 'rgba(245, 158, 11, 0.12)' } : undefined
        }
      >
        {/* Left accent stripe — only on the nearest row. Anchors the
            "this is the suggestion" affordance to the leading edge. */}
        <YStack
          width={4}
          style={{
            backgroundColor: nearest ? '#F59E0B' : 'transparent',
          }}
        />
        <XStack
          flex={1}
          items="center"
          gap="$3"
          px={H_PADDING}
          py={nearest ? '$3' : '$2.5'}
        >
          <Image
            source={{ uri: stop.image }}
            style={{ width: 48, height: 48, borderRadius: 8 }}
            resizeMode="cover"
          />
          <YStack flex={1} gap="$1">
            <XStack items="center" gap="$2">
              <YStack
                width={22}
                height={22}
                rounded={11}
                bg={c.primary as any}
                items="center"
                justify="center"
              >
                <SizableText
                  size="$1"
                  color={c.onBrand as any}
                  fontFamily="$body"
                  fontWeight="800"
                >
                  {index + 1}
                </SizableText>
              </YStack>
              <SizableText
                size="$3"
                color={c.text as any}
                fontFamily="$body"
                fontWeight={nearest ? '700' : '600'}
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {stop.name}
              </SizableText>
              {nearest && <NearestPill />}
            </XStack>
            {nearest && (
              <SizableText
                size="$2"
                color={c.textMuted as any}
                fontFamily="$body"
              >
                {t('excursion.startFrom.nearestCaption', {
                  defaultValue: 'Closest to your location',
                })}
              </SizableText>
            )}
          </YStack>
          {selected && <Check size={20} color={c.primary as any} />}
        </XStack>
      </XStack>
    </Pressable>
  )
}

function NearestPill() {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  return (
    <XStack
      items="center"
      gap={4}
      px="$2"
      py="$0.5"
      rounded="$10"
      bg={c.accent as any}
    >
      <MapPin size={11} color={ON_ACCENT as any} />
      <SizableText
        size="$1"
        fontFamily="$body"
        fontWeight="800"
        style={{
          color: ON_ACCENT,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {t('excursion.startFrom.nearestBadge', { defaultValue: 'Nearest' })}
      </SizableText>
    </XStack>
  )
}
