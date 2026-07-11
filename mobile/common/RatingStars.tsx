import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { Star } from '@tamagui/lucide-icons'
import { XStack, SizableText } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useTranslation } from 'react-i18next'
import type {
  PublicRatingAggregate,
  RatingTargetType,
  RatingValue,
} from '@guide-me-app/core'
import { useMyRating } from '../hooks/useMyRating'
import { useRateTarget } from '../hooks/useRateTarget'
import { UnauthorizedError } from '../lib/authedApi'
import { clearAuthChoice } from '../providers/AuthChoice'
import { palette } from '../constants/Colors'

const LOGIN_HREF = '/login' as Href
const STAR_VALUES: RatingValue[] = [1, 2, 3, 4, 5]

// Filled + outline colors for the star icons. Amber matches the app's
// accent token — same one used on map pins.
const STAR_FILLED = palette.amber
const STAR_OUTLINE = palette.neutral400

type InteractiveProps = {
  mode: 'interactive'
  targetType: RatingTargetType
  targetId: string
  size?: number
}

type DisplayProps = {
  mode: 'display'
  aggregate: PublicRatingAggregate | undefined
  size?: number
  // When true, hides the "(N)" count and shows only the average. Used in
  // tight list-card layouts.
  compact?: boolean
  // Optional tap handler. When set, the badge (populated OR empty) becomes
  // Pressable — used to open the rating sheet manually from the detail
  // screens. When omitted, the badge is inert and an empty aggregate
  // renders nothing (keeps list-card layouts clean).
  onPress?: () => void
  // Only meaningful when onPress is set. When true and aggregate is empty,
  // renders "No ratings yet" instead of returning null — so the detail
  // screen gets a visible call-to-action even before anyone has rated.
  showEmptyState?: boolean
}

export function RatingStars(props: InteractiveProps | DisplayProps) {
  if (props.mode === 'interactive') {
    return <InteractiveStars {...props} />
  }
  return <DisplayStars {...props} />
}

function InteractiveStars({
  targetType,
  targetId,
  size = 28,
}: Omit<InteractiveProps, 'mode'>) {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToastController()
  const getMyRating = useMyRating()
  const { submit, clear, isPending } = useRateTarget()
  const myRating = getMyRating(targetType, targetId)

  const onPress = useCallback(
    async (value: RatingValue) => {
      try {
        // Tap the star that's already selected → clear the rating.
        if (myRating === value) {
          await clear(targetType, targetId)
        } else {
          await submit(targetType, targetId, value)
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          await clearAuthChoice()
          router.push(LOGIN_HREF)
          return
        }
        toast.show(t('common.somethingWentWrong'))
      }
    },
    [myRating, submit, clear, targetType, targetId, router, toast, t],
  )

  return (
    <XStack gap="$2" items="center" opacity={isPending ? 0.6 : 1}>
      {STAR_VALUES.map((v) => (
        <Pressable
          key={v}
          onPress={() => onPress(v)}
          disabled={isPending}
          hitSlop={4}
        >
          <Star
            size={size}
            color={
              myRating !== null && v <= myRating
                ? (STAR_FILLED as any)
                : (STAR_OUTLINE as any)
            }
            fill={
              myRating !== null && v <= myRating
                ? (STAR_FILLED as any)
                : 'transparent'
            }
          />
        </Pressable>
      ))}
    </XStack>
  )
}

function DisplayStars({
  aggregate,
  size = 14,
  compact = false,
  onPress,
  showEmptyState = false,
}: Omit<DisplayProps, 'mode'>) {
  const { t } = useTranslation()
  const isEmpty = !aggregate || aggregate.count === 0

  // Empty aggregate: render "No ratings yet" only when the caller opted in
  // via `showEmptyState`. Otherwise skip the whole badge (list cards).
  if (isEmpty && !showEmptyState) return null

  const content = isEmpty ? (
    <XStack gap="$1.5" items="center">
      <Star
        size={size}
        color={STAR_OUTLINE as any}
        fill="transparent"
      />
      <SizableText color="$colorPress" fontFamily="$body" size="$2">
        {t('ratings.noRatingsYet')}
      </SizableText>
    </XStack>
  ) : (
    <XStack gap="$1.5" items="center">
      <Star size={size} color={STAR_FILLED as any} fill={STAR_FILLED as any} />
      <SizableText
        color="$color"
        fontFamily="$body"
        fontWeight="600"
        size="$2"
      >
        {aggregate!.avg.toFixed(1)}
      </SizableText>
      {!compact && (
        <SizableText color="$colorPress" fontFamily="$body" size="$2">
          · {aggregate!.count}
        </SizableText>
      )}
    </XStack>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={6}>
        {content}
      </Pressable>
    )
  }
  return content
}
