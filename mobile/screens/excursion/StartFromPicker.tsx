import { useTranslation } from 'react-i18next'
import { FlatList, Image, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, MapPin } from '@tamagui/lucide-icons'
import { H3, SizableText, XStack, YStack } from 'tamagui'
import { BottomSheet } from '../../common/BottomSheet'
import type { PublicExcursionStop } from '@guide-me-app/core'

const H_PADDING = 20

type Props = {
  visible: boolean
  stops: PublicExcursionStop[]
  selectedIndex: number
  // Index of the stop closest to the user, or null if GPS not available.
  // Renders a "Nearest" badge on this row.
  nearestIndex: number | null
  onSelect: (index: number) => void
  onClose: () => void
}

// Bottom-sheet picker for the "Starting from" chip on the preview panel.
// One row per stop: image + index + name + nearest-badge + selected-check.
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

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.75}
      header={
        <YStack px={H_PADDING} pt="$2" pb="$3">
          <H3 fontFamily="$body" fontWeight="700" color="$color">
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
  return (
    <Pressable onPress={onPress}>
      <XStack
        items="center"
        gap="$3"
        px={H_PADDING}
        py="$2.5"
        bg={selected ? '$surfaceMuted' : 'transparent'}
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
              bg="$primary"
              items="center"
              justify="center"
            >
              <SizableText
                size="$1"
                color="$colorOnBrand"
                fontFamily="$body"
                fontWeight="800"
              >
                {index + 1}
              </SizableText>
            </YStack>
            <SizableText
              size="$3"
              color="$color"
              fontFamily="$body"
              fontWeight="600"
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {stop.name}
            </SizableText>
          </XStack>
          {nearest && (
            <XStack items="center" gap="$1">
              <MapPin size={12} color="$primary" />
              <SizableText
                size="$1"
                color="$primary"
                fontFamily="$body"
                fontWeight="700"
                style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                {t('excursion.startFrom.nearestBadge', {
                  defaultValue: 'Nearest',
                })}
              </SizableText>
            </XStack>
          )}
        </YStack>
        {selected && <Check size={20} color="$primary" />}
      </XStack>
    </Pressable>
  )
}
