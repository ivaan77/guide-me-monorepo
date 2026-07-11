import { useEffect } from 'react'
import { Animated as RNAnimated, Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Pause, Play, Sparkles, X } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import Animated, { FadeIn, FadeOut, Easing } from 'react-native-reanimated'
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioStatus,
} from 'expo-audio'
import type { PublicInterestingFact } from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'
import { useAudioPlaybackTracker } from '../../hooks/useAudioPlaybackTracker'

const ON_AMBER = palette.navy

type Props = {
  fact: PublicInterestingFact | null
  // Animated bottom offset — driven by the snap-card height so the player
  // floats just above the card edge whether it's at the small, medium, or
  // tall snap point. Same Animated.Value the snap card uses for its height.
  bottomAnim: RNAnimated.Value
  onDismiss: () => void
}

// Non-modal "now playing" bar for interesting facts. Map stays fully usable
// underneath. Owns its own expo-audio player and auto-plays on mount, so
// dismiss = unmount = audio stops cleanly. When playback finishes naturally
// the bar stays visible (paused at the end) so the user can replay.
export function FloatingFactPlayer({ fact, bottomAnim, onDismiss }: Props) {
  if (!fact) return null
  // 8dp gap above the snap card. `bottom` is driven by the same Animated.Value
  // that drives the snap card's height, so the bar tracks the card edge in
  // real time as the user drags.
  const bottom = RNAnimated.add(bottomAnim, new RNAnimated.Value(8))
  return (
    <RNAnimated.View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom,
        zIndex: 13,
        elevation: 13,
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        key={fact.id}
        entering={FadeIn.duration(250).easing(Easing.out(Easing.cubic))}
        exiting={FadeOut.duration(180)}
      >
        <PlayerCard fact={fact} onDismiss={onDismiss} />
      </Animated.View>
    </RNAnimated.View>
  )
}

function PlayerCard({
  fact,
  onDismiss,
}: {
  fact: PublicInterestingFact
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const player = useAudioPlayer(fact.audioUrl ?? null)
  const status: AudioStatus | null = useAudioPlayerStatus(player)
  const isPlaying = status?.playing ?? false
  const duration = status?.duration ?? 0
  const currentTime = status?.currentTime ?? 0
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0

  // Fact-audio contributes to the marketing "hours listened" counter. Each
  // fact renders a fresh PlayerCard (key=fact.id in the parent) so unmount
  // fires per-fact and the ms totals get emitted one event per fact.
  useAudioPlaybackTracker({
    isPlaying,
    sourceType: 'fact',
    sourceId: fact.id,
    enabled: !!fact.audioUrl,
  })

  // Auto-play on mount.
  useEffect(() => {
    if (!fact.audioUrl) return
    try {
      player.play()
    } catch {
      // expo-audio may not be ready yet — status effect below will retry
    }
  }, [fact.audioUrl, player])

  // Defensive cleanup on unmount.
  useEffect(() => {
    return () => {
      try {
        player.pause()
      } catch {
        // already released
      }
    }
  }, [player])

  const handleToggle = () => {
    if (!fact.audioUrl) return
    if (isPlaying) {
      player.pause()
      return
    }
    if (
      status?.didJustFinish ||
      (status && status.duration > 0 && status.currentTime >= status.duration)
    ) {
      player.seekTo(0)
    }
    player.play()
  }

  return (
    <YStack
      bg="$accent"
      rounded="$6"
      style={{
        overflow: 'hidden',
        ...SHADOW.amberFloating,
      }}
    >
      <XStack items="center" gap="$2.5" px="$3" py="$2.5">
        <YStack
          width={32}
          height={32}
          rounded={16}
          items="center"
          justify="center"
          style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
        >
          <Sparkles size={16} color={ON_AMBER as any} />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <SizableText
            size="$1"
            fontFamily="$body"
            fontWeight="700"
            numberOfLines={1}
            style={{
              color: ON_AMBER,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              opacity: 0.75,
            }}
          >
            {t('excursion.facts.bannerLabel')}
          </SizableText>
          <SizableText
            size="$3"
            fontFamily="$body"
            fontWeight="600"
            numberOfLines={1}
            style={{ color: ON_AMBER }}
          >
            {fact.title}
          </SizableText>
        </YStack>
        <Pressable onPress={handleToggle} hitSlop={8}>
          <YStack
            width={36}
            height={36}
            rounded={18}
            items="center"
            justify="center"
            style={{ backgroundColor: 'rgba(11,31,58,0.18)' }}
          >
            {isPlaying ? (
              <Pause size={18} color={ON_AMBER as any} />
            ) : (
              <Play size={18} color={ON_AMBER as any} />
            )}
          </YStack>
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          hitSlop={8}
        >
          <YStack
            width={24}
            height={24}
            rounded={12}
            items="center"
            justify="center"
            style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
          >
            <X size={12} color={ON_AMBER as any} />
          </YStack>
        </Pressable>
      </XStack>
      <YStack
        style={{
          height: 3,
          width: `${progress * 100}%`,
          backgroundColor: ON_AMBER,
          opacity: 0.65,
        }}
      />
    </YStack>
  )
}
