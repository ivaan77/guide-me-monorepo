import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  type ViewToken,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import {
  type AudioStatus,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'
import { Pause, Play, Square } from '@tamagui/lucide-icons'
import { H3, Paragraph, SizableText, XStack, YStack, useTheme } from 'tamagui'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import { BottomSheet } from '../../common/BottomSheet'
import type { PublicExcursionStop as ExcursionStop } from '@guide-me-app/core'

const H_PADDING = 20

type Props = {
  visible: boolean
  stop: ExcursionStop | null
  onClose: () => void
}

export function StopDetailSheet({ visible, stop, onClose }: Props) {
  if (!stop) return null

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={0.88}
      header={
        <XStack px={H_PADDING} pt="$2" pb="$3" items="center">
          <H3 fontFamily="$body" fontWeight="700" color="$color" flex={1}>
            {stop.name}
          </H3>
        </XStack>
      }
    >
      <StopBody stop={stop} />
    </BottomSheet>
  )
}

function StopBody({ stop }: { stop: ExcursionStop }) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const images = stop.images?.length ? stop.images : [stop.image]
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Real audio playback via expo-audio. Player is created lazily by passing
  // null until a URL is available, so we don't allocate native resources
  // when this stop has no audio. The hook handles cleanup on unmount.
  const player = useAudioPlayer(stop.audioUrl ?? null)
  const status: AudioStatus | null = useAudioPlayerStatus(player)
  const isPlaying = status?.playing ?? false
  const progress =
    status && status.duration > 0
      ? Math.min(1, Math.max(0, status.currentTime / status.duration))
      : 0

  // Pause when the sheet unmounts (excursion screen navigates away or closes
  // the sheet). expo-audio also auto-pauses on unmount via useAudioPlayer's
  // own cleanup, but this is belt-and-suspenders.
  useEffect(() => {
    return () => {
      try {
        player.pause()
      } catch {
        // player already released
      }
    }
  }, [player])

  const handlePlay = () => {
    if (!stop.audioUrl) return
    // If the audio finished, expo-audio leaves currentTime at duration and
    // play() is a no-op. Seek back to the start so a tap on Play after
    // completion restarts the track.
    if (status?.didJustFinish || (status && status.duration > 0 && status.currentTime >= status.duration)) {
      player.seekTo(0)
    }
    player.play()
  }
  const handlePause = () => {
    player.pause()
  }
  const handleStop = () => {
    player.pause()
    player.seekTo(0)
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0]
      if (first?.index != null) setCarouselIndex(first.index)
    },
  ).current
  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 60 }),
    [],
  )

  return (
    <>
      <YStack>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, idx) => `${uri}-${idx}`}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={{ width: screenWidth, height: screenWidth * 0.7 }}
              resizeMode="cover"
            />
          )}
        />
        {images.length > 1 && (
          <XStack
            position="absolute"
            b="$3"
            l={0}
            r={0}
            items="center"
            justify="center"
            gap="$2"
            style={{ pointerEvents: 'none' }}
          >
            {images.map((_, idx) => (
              <YStack
                key={idx}
                width={idx === carouselIndex ? 18 : 6}
                height={6}
                rounded={3}
                bg={idx === carouselIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
              />
            ))}
          </XStack>
        )}
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack px={H_PADDING} pt="$4" gap="$3">
          <AudioControls
            hasAudio={!!stop.audioUrl}
            isPlaying={isPlaying}
            progress={progress}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
          />
          <Paragraph color="$color" fontFamily="$body" size="$4" lineHeight="$6">
            {stop.description}
          </Paragraph>
        </YStack>
      </ScrollView>
    </>
  )
}

function AudioControls({
  hasAudio,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onStop,
}: {
  hasAudio: boolean
  isPlaying: boolean
  progress: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}) {
  const { t } = useTranslation()
  if (!hasAudio) {
    return (
      <XStack
        items="center"
        bg="$surfaceMuted"
        rounded="$5"
        px="$3"
        py="$3"
        gap="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <YStack
          width={36}
          height={36}
          rounded={18}
          bg="$background"
          items="center"
          justify="center"
        >
          <Play size={16} color="$colorPress" />
        </YStack>
        <YStack flex={1}>
          <SizableText size="$3" color="$color" fontFamily="$body" fontWeight="600">
            {t('excursion.stopSheet.audioTitle')}
          </SizableText>
          <SizableText size="$2" color="$colorPress" fontFamily="$body">
            {t('excursion.stopSheet.audioMissing')}
          </SizableText>
        </YStack>
      </XStack>
    )
  }

  return (
    <XStack
      items="center"
      bg="$surfaceMuted"
      rounded="$5"
      px="$3"
      py="$3"
      gap="$3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack flex={1} gap="$0.5">
        <SizableText size="$3" color="$color" fontFamily="$body" fontWeight="600">
          {t('excursion.stopSheet.audioTitle')}
        </SizableText>
        <SizableText size="$2" color="$colorPress" fontFamily="$body">
          {isPlaying
            ? t('excursion.stopSheet.audioPlaying')
            : t('excursion.stopSheet.audioPrompt')}
        </SizableText>
      </YStack>
      <XStack gap="$2" items="center">
        {isPlaying ? (
          <PlayButtonWithRing progress={progress} onPress={onPause} playing />
        ) : (
          <PlayButtonWithRing progress={progress} onPress={onPlay} />
        )}
        <CircleButton icon={Square} onPress={onStop} disabled={!isPlaying} />
      </XStack>
    </XStack>
  )
}

function CircleButton({
  icon: Icon,
  onPress,
  primary,
  disabled,
}: {
  icon: typeof Play
  onPress: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
      <YStack
        width={40}
        height={40}
        rounded={20}
        bg={primary ? '$primary' : '$background'}
        borderWidth={primary ? 0 : 1}
        borderColor="$borderColor"
        items="center"
        justify="center"
        opacity={disabled ? 0.4 : 1}
      >
        <Icon size={16} color={primary ? '$colorOnBrand' : '$color'} />
      </YStack>
    </Pressable>
  )
}

// 40dp play/pause button with a thin progress arc around it. The arc starts
// at the 12 o'clock position and sweeps clockwise as `progress` goes 0 → 1.
function PlayButtonWithRing({
  progress,
  playing,
  onPress,
}: {
  progress: number
  playing?: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const trackColor = theme.borderColor.val
  const progressColor = theme.primary.val

  // Outer ring sits 4dp away from the 40dp button so the whole control is
  // 48dp wide. Stroke is drawn on the path centerline, so the visible ring
  // sits between radius - stroke/2 and radius + stroke/2.
  const SIZE = 48
  const STROKE = 3
  const RADIUS = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const offset = CIRC * (1 - progress)

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <YStack width={SIZE} height={SIZE} items="center" justify="center">
        <Svg
          width={SIZE}
          height={SIZE}
          style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
        >
          <SvgCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={trackColor}
            strokeWidth={STROKE}
            fill="none"
          />
          <SvgCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={progressColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        <YStack
          width={40}
          height={40}
          rounded={20}
          bg="$primary"
          items="center"
          justify="center"
        >
          {playing ? (
            <Pause size={16} color="$colorOnBrand" />
          ) : (
            <Play size={16} color="$colorOnBrand" />
          )}
        </YStack>
      </YStack>
    </Pressable>
  )
}
