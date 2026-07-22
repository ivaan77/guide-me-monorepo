import { Fragment, useMemo } from 'react'
import { Image, Pressable, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type {
  PublicExcursionStop as ExcursionStop,
  PublicPoi as Poi,
  PublicSubStop,
} from '@guide-me-app/core'
import { POI_CATEGORY_META } from './poiCategory'
import { BUNDLE_ACCENT } from './StopBundlePin'
import { useAppTheme } from '../../providers/ThemeContext'

type Status = 'visited' | 'current' | 'upcoming'

type Props = {
  stops: ExcursionStop[]
  pois: Poi[]
  currentIndex: number
  phase: 'preview' | 'navigating' | 'arrived' | 'outro' | 'complete'
  onPoiPress: (poi: Poi) => void
  // Optional: tap a stop row to enlarge its image in a lightbox. Excursion
  // screen passes this to drive its <ImageLightbox>. List works fine without
  // it — rows just become non-tappable in that case.
  onStopPress?: (stop: ExcursionStop) => void
  // Optional: tap a sub-stop row under a bundle to open its detail sheet.
  // Receives both the sub-stop and its parent stop so the caller can build
  // the composite favorite id.
  onSubStopPress?: (sub: PublicSubStop, parent: ExcursionStop) => void
}

type StopEntry = { kind: 'stop'; data: ExcursionStop; stopIndex: number }
type PoiEntry = { kind: 'poi'; data: Poi }
type Entry = StopEntry | PoiEntry

export function StopsList({
  stops,
  pois,
  currentIndex,
  phase,
  onPoiPress,
  onStopPress,
  onSubStopPress,
}: Props) {
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
            <Fragment key={entry.data.id}>
              <StopRow
                stop={entry.data}
                stopIndex={entry.stopIndex}
                status={statusFor(entry.stopIndex, currentIndex, phase)}
                onPress={
                  onStopPress ? () => onStopPress(entry.data) : undefined
                }
              />
              {(entry.data.subStops?.length ?? 0) > 0 &&
                entry.data.subStops!.map((sub, subIdx) => (
                  <SubStopRow
                    key={`${entry.data.id}:${sub.id}`}
                    sub={sub}
                    subIndex={subIdx}
                    onPress={
                      onSubStopPress
                        ? () => onSubStopPress(sub, entry.data)
                        : undefined
                    }
                  />
                ))}
            </Fragment>
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
  onPress,
}: {
  stop: ExcursionStop
  stopIndex: number
  status: Status
  onPress?: () => void
}) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  const isVisited = status === 'visited'
  const isCurrent = status === 'current'
  // A "bundle" stop is one with sub-stops. We use a different accent
  // (violet) across map pin, list row, and bundle-related controls so the
  // user identifies it consistently.
  const subCount = stop.subStops?.length ?? 0
  const isBundle = subCount > 0
  const numberBg = isBundle ? BUNDLE_ACCENT : undefined

  const row = (
    <XStack
      items="center"
      gap="$3"
      px="$3"
      py="$2.5"
      rounded="$5"
      bg={(isCurrent ? c.surfaceMuted : 'transparent') as any}
      borderWidth={isCurrent ? 1 : 0}
      borderColor={(isBundle ? BUNDLE_ACCENT : c.primary) as any}
    >
      <YStack
        width={28}
        height={28}
        rounded={14}
        items="center"
        justify="center"
        bg={
          (isCurrent && !isBundle
            ? c.primary
            : isBundle
              ? numberBg
              : c.surfaceMuted) as any
        }
        borderWidth={isVisited || isCurrent || isBundle ? 0 : 1}
        borderColor={c.border as any}
      >
        {isVisited ? (
          <Check
            size={16}
            color={isBundle ? '#FFFFFF' : (c.primary as any)}
          />
        ) : (
          <SizableText
            size="$2"
            fontFamily="$body"
            fontWeight="700"
            color={
              (isCurrent || isBundle ? c.onBrand : c.textMuted) as any
            }
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
        <XStack items="center" gap="$2">
          <SizableText
            size="$4"
            fontFamily="$body"
            fontWeight={isCurrent ? '700' : '600'}
            color={(isVisited ? c.textMuted : c.text) as any}
            numberOfLines={1}
            flex={1}
          >
            {stop.name}
          </SizableText>
          {isBundle && (
            <YStack
              px="$1.5"
              py="$0.5"
              rounded="$2"
              style={{ backgroundColor: BUNDLE_ACCENT }}
            >
              <SizableText
                size="$1"
                fontFamily="$body"
                fontWeight="800"
                style={{
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {t('excursion.list.bundleCount', {
                  count: subCount,
                  defaultValue: `${subCount} stops`,
                })}
              </SizableText>
            </YStack>
          )}
        </XStack>
        {isCurrent && (
          <SizableText
            size="$2"
            fontFamily="$body"
            fontWeight="600"
            color={isBundle ? (BUNDLE_ACCENT as any) : c.primary}
            style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
          >
            {t('excursion.list.current')}
          </SizableText>
        )}
      </YStack>
    </XStack>
  )

  if (!onPress) return row
  return <Pressable onPress={onPress}>{row}</Pressable>
}

// Indented child row under a bundle's StopRow. Visually distinct from the
// parent: smaller image, indented from the left, violet dot badge with the
// 1-based position in the bundle. Tap opens the sub-stop's own detail sheet.
function SubStopRow({
  sub,
  subIndex,
  onPress,
}: {
  sub: PublicSubStop
  subIndex: number
  onPress?: () => void
}) {
  const { c } = useAppTheme()
  const row = (
    <XStack items="center" gap="$3" pl="$8" pr="$3" py="$1.5">
      <YStack
        width={22}
        height={22}
        rounded={11}
        items="center"
        justify="center"
        style={{ backgroundColor: BUNDLE_ACCENT }}
      >
        <SizableText
          size="$1"
          fontFamily="$body"
          fontWeight="800"
          style={{ color: '#FFFFFF' }}
        >
          {subIndex + 1}
        </SizableText>
      </YStack>
      <Image
        source={{ uri: sub.image }}
        style={{ width: 36, height: 36, borderRadius: 8 }}
        resizeMode="cover"
      />
      <YStack flex={1}>
        <SizableText
          size="$3"
          fontFamily="$body"
          fontWeight="600"
          color={c.text as any}
          numberOfLines={1}
        >
          {sub.name}
        </SizableText>
      </YStack>
    </XStack>
  )
  if (!onPress) return row
  return <Pressable onPress={onPress}>{row}</Pressable>
}

function PoiRow({ poi, onPress }: { poi: Poi; onPress: () => void }) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
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
            color={c.text as any}
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
