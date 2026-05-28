import { useMemo } from 'react'
import { Image, Pressable, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type {
  PublicExcursionStop as ExcursionStop,
  PublicPoi as Poi,
} from '@guide-me-app/core'
import { POI_CATEGORY_META } from './poiCategory'

type Status = 'visited' | 'current' | 'upcoming'

type Props = {
  stops: ExcursionStop[]
  pois: Poi[]
  currentIndex: number
  phase: 'preview' | 'navigating' | 'arrived' | 'complete'
  onPoiPress: (poi: Poi) => void
}

type StopEntry = { kind: 'stop'; data: ExcursionStop; stopIndex: number }
type PoiEntry = { kind: 'poi'; data: Poi }
type Entry = StopEntry | PoiEntry

export function StopsList({ stops, pois, currentIndex, phase, onPoiPress }: Props) {
  const entries = useMemo<Entry[]>(() => {
    const stopEntries: Entry[] = stops.map((stop, stopIndex) => ({
      kind: 'stop',
      data: stop,
      stopIndex,
    }))
    const poiEntries: Entry[] = pois.map((poi) => ({ kind: 'poi', data: poi }))
    return [...stopEntries, ...poiEntries].sort(
      (a, b) => a.data.order - b.data.order,
    )
  }, [stops, pois])

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$2">
        {entries.map((entry) =>
          entry.kind === 'stop' ? (
            <StopRow
              key={entry.data.id}
              stop={entry.data}
              stopIndex={entry.stopIndex}
              status={statusFor(entry.stopIndex, currentIndex, phase)}
            />
          ) : (
            <PoiRow
              key={entry.data.id}
              poi={entry.data}
              onPress={() => onPoiPress(entry.data)}
            />
          ),
        )}
      </YStack>
    </ScrollView>
  )
}

function statusFor(
  stopIndex: number,
  currentIndex: number,
  phase: Props['phase'],
): Status {
  if (phase === 'preview') return 'upcoming'
  if (phase === 'complete') return 'visited'
  if (stopIndex < currentIndex) return 'visited'
  if (stopIndex === currentIndex)
    return phase === 'arrived' ? 'visited' : 'current'
  return 'upcoming'
}

function StopRow({
  stop,
  stopIndex,
  status,
}: {
  stop: ExcursionStop
  stopIndex: number
  status: Status
}) {
  const { t } = useTranslation()
  const isVisited = status === 'visited'
  const isCurrent = status === 'current'

  return (
    <XStack
      items="center"
      gap="$3"
      px="$3"
      py="$2.5"
      rounded="$5"
      bg={isCurrent ? '$surfaceMuted' : 'transparent'}
      borderWidth={isCurrent ? 1 : 0}
      borderColor="$primary"
    >
      <YStack
        width={28}
        height={28}
        rounded={14}
        items="center"
        justify="center"
        bg={isCurrent ? '$primary' : '$surfaceMuted'}
        borderWidth={isVisited || isCurrent ? 0 : 1}
        borderColor="$borderColor"
      >
        {isVisited ? (
          <Check size={16} color="$primary" />
        ) : (
          <SizableText
            size="$2"
            fontFamily="$body"
            fontWeight="700"
            color={isCurrent ? '$colorOnBrand' : '$colorPress'}
          >
            {stopIndex + 1}
          </SizableText>
        )}
      </YStack>

      <Image
        source={{ uri: stop.image }}
        style={{ width: 44, height: 44, borderRadius: 10 }}
        resizeMode="cover"
      />

      <YStack flex={1} gap="$0.5">
        <SizableText
          size="$4"
          fontFamily="$body"
          fontWeight={isCurrent ? '700' : '600'}
          color={isVisited ? '$colorPress' : '$color'}
          numberOfLines={1}
        >
          {stop.name}
        </SizableText>
        {isCurrent && (
          <SizableText
            size="$2"
            fontFamily="$body"
            fontWeight="600"
            color="$primary"
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {t('excursion.list.current')}
          </SizableText>
        )}
      </YStack>
    </XStack>
  )
}

function PoiRow({ poi, onPress }: { poi: Poi; onPress: () => void }) {
  const { t } = useTranslation()
  const meta = POI_CATEGORY_META[poi.category]
  const Icon = meta.icon
  return (
    <Pressable onPress={onPress}>
      <XStack items="center" gap="$3" px="$3" py="$2.5">
        <YStack
          width={28}
          height={28}
          rounded={14}
          items="center"
          justify="center"
          bg="#FFFFFF"
          borderWidth={2}
          borderColor={meta.color as any}
        >
          <Icon size={14} color={meta.color as any} />
        </YStack>

        <Image
          source={{ uri: poi.image }}
          style={{ width: 44, height: 44, borderRadius: 10 }}
          resizeMode="cover"
        />

        <YStack flex={1} gap="$0.5">
          <SizableText
            size="$4"
            fontFamily="$body"
            fontWeight="600"
            color="$color"
            numberOfLines={1}
          >
            {poi.name}
          </SizableText>
          <SizableText
            size="$2"
            fontFamily="$body"
            fontWeight="700"
            color={meta.color as any}
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {t(`place.category.${poi.category}` as const)}
          </SizableText>
        </YStack>
      </XStack>
    </Pressable>
  )
}
