import { useEffect } from 'react'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  type AudioStatus,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio'
import { Headphones, Pause, Play, Square } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack, useTheme } from 'tamagui'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

// Reusable audio control card with a play button wrapped in a progress ring.
// Three contexts: excursion stops, city audio, interesting facts. Same look
// everywhere keeps the visual language consistent.

type Props = {
  // null when this entity has no audio at all; renders a "no audio" stub.
  audioUrl: string | null | undefined
  // Card title shown next to the controls.
  title: string
  // Optional override for the "tap to listen" / "playing…" sub-line. Falls
  // back to the excursion stop sheet strings.
  promptKey?: string
  playingKey?: string
  // Optional override for the "no audio uploaded" message. Defaults to the
  // existing stop sheet copy.
  missingKey?: string
}

export function AudioPlayer({
  audioUrl,
  title,
  promptKey,
  playingKey,
  missingKey,
}: Props) {
  const { t } = useTranslation()

  // useAudioPlayer accepts null to lazily allocate. We pass null when no URL
  // is supplied so we don't open a native audio session for a stub card.
  const player = useAudioPlayer(audioUrl ?? null)
  const status: AudioStatus | null = useAudioPlayerStatus(player)
  const isPlaying = status?.playing ?? false
  const progress =
    status && status.duration > 0
      ? Math.min(1, Math.max(0, status.currentTime / status.duration))
      : 0

  // Auto-pause on unmount. expo-audio's own cleanup also handles this; this
  // is defensive against the rare case where the consumer detaches the
  // component without unmounting the player hook.
  useEffect(() => {
    return () => {
      try {
        player.pause()
      } catch {
        // already released
      }
    }
  }, [player])

  const handlePlay = () => {
    if (!audioUrl) return
    // expo-audio: play() is a no-op when currentTime === duration. Seek to 0
    // so a tap after completion restarts the track.
    if (
      status?.didJustFinish ||
      (status && status.duration > 0 && status.currentTime >= status.duration)
    ) {
      player.seekTo(0)
    }
    player.play()
  }
  const handlePause = () => player.pause()
  const handleStop = () => {
    player.pause()
    player.seekTo(0)
  }

  if (!audioUrl) {
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
          <Headphones size={16} color="$colorPress" />
        </YStack>
        <YStack flex={1}>
          <SizableText size="$3" color="$color" fontFamily="$body" fontWeight="600">
            {title}
          </SizableText>
          <SizableText size="$2" color="$colorPress" fontFamily="$body">
            {t((missingKey ?? 'excursion.stopSheet.audioMissing') as never)}
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
      <YStack
        width={36}
        height={36}
        rounded={18}
        bg="$background"
        items="center"
        justify="center"
      >
        <Headphones size={16} color="$primary" />
      </YStack>
      <YStack flex={1} gap="$0.5">
        <SizableText size="$3" color="$color" fontFamily="$body" fontWeight="600">
          {title}
        </SizableText>
        <SizableText size="$2" color="$colorPress" fontFamily="$body">
          {isPlaying
            ? t((playingKey ?? 'excursion.stopSheet.audioPlaying') as never)
            : t((promptKey ?? 'excursion.stopSheet.audioPrompt') as never)}
        </SizableText>
      </YStack>
      <XStack gap="$2" items="center">
        {isPlaying ? (
          <PlayButtonWithRing progress={progress} onPress={handlePause} playing />
        ) : (
          <PlayButtonWithRing progress={progress} onPress={handlePlay} />
        )}
        <CircleButton icon={Square} onPress={handleStop} disabled={!isPlaying} />
      </XStack>
    </XStack>
  )
}

function CircleButton({
  icon: Icon,
  onPress,
  disabled,
}: {
  icon: typeof Play
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
      <YStack
        width={40}
        height={40}
        rounded={20}
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        items="center"
        justify="center"
        opacity={disabled ? 0.4 : 1}
      >
        <Icon size={16} color="$color" />
      </YStack>
    </Pressable>
  )
}

// 40dp play/pause button with a sync-style ring around it. A thin dashed
// track rotates clockwise while audio is playing; a thicker solid arc on
// top fills clockwise from 12 o'clock as `progress` goes 0 → 1.
export function PlayButtonWithRing({
  progress,
  playing,
  onPress,
}: {
  progress: number
  playing?: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  // Use the muted text color for the dashed track — borderColor is too
  // subtle to read against the sheet's surface, especially in light mode.
  const trackColor = theme.colorPress.val
  const progressColor = theme.primary.val

  const SIZE = 48
  const PROGRESS_STROKE = 3
  const TRACK_STROKE = 1
  const RADIUS = (SIZE - PROGRESS_STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const offset = CIRC * (1 - progress)

  const rotation = useSharedValue(0)
  useEffect(() => {
    if (playing) {
      rotation.value = 0
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false,
      )
    } else {
      cancelAnimation(rotation)
    }
    return () => cancelAnimation(rotation)
  }, [playing, rotation])

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  // Ring is hidden until the user has actually started playback. Stop
  // resets progress to 0 and hides the ring again.
  const hasStarted = progress > 0

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <YStack width={SIZE} height={SIZE} items="center" justify="center">
        {hasStarted && (
          <Animated.View
            style={[
              { position: 'absolute', width: SIZE, height: SIZE },
              trackAnimatedStyle,
            ]}
          >
            <Svg width={SIZE} height={SIZE}>
              <SvgCircle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={trackColor}
                strokeWidth={TRACK_STROKE}
                strokeDasharray="3 4"
                fill="none"
              />
            </Svg>
          </Animated.View>
        )}
        {hasStarted && (
          <Svg
            width={SIZE}
            height={SIZE}
            style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
          >
            <SvgCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={progressColor}
              strokeWidth={PROGRESS_STROKE}
              fill="none"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </Svg>
        )}
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
