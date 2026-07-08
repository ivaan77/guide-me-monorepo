import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@clerk/clerk-expo'
import { useToastController } from '@tamagui/toast'
import { Star } from '@tamagui/lucide-icons'
import { H2, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import type { RatingTargetType, RatingValue } from '@guide-me-app/core'
import { BottomSheet } from './BottomSheet'
import { useRateTarget } from '../hooks/useRateTarget'
import { UnauthorizedError } from '../lib/authedApi'
import { clearAuthChoice } from '../providers/AuthChoice'
import { palette } from '../constants/Colors'

const LOGIN_HREF = '/login' as Href
const STAR_VALUES: RatingValue[] = [1, 2, 3, 4, 5]
const STAR_FILLED = palette.amber
const STAR_OUTLINE = palette.neutral400

// Timing constants for the reveal → confirmation → close cascade. Keep the
// total under ~1s so the user isn't waiting on the sheet; but not so fast
// they can't see their tap register.
const CONFIRMATION_HOLD_MS = 900

type Props = {
  visible: boolean
  onClose: () => void
  targetType: RatingTargetType
  targetId: string
  // Localized entity name interpolated into the title (e.g. "Zagreb", the
  // excursion name). Excursion titles ignore this — see i18n keys.
  entityName?: string
}

// Bottom-sheet rating prompt shown at contextually-appropriate moments
// (end of excursion, on exit from city/place after ≥30s). Tap a star to
// submit — no "Save" button. Shows an inline "Thanks!" confirmation for
// ~900ms so the user can see their selection register before the sheet
// slides away. Guest tap → login route.
export function RatingPromptSheet({
  visible,
  onClose,
  targetType,
  targetId,
  entityName,
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToastController()
  const { isSignedIn } = useAuth()
  const { submit } = useRateTarget()

  // Fingers-off state — the value the user tapped stays lit after release.
  // `hovered` is the transient press-in feedback that overrides `selected`
  // while the user is dragging across the row.
  const [selected, setSelected] = useState<RatingValue | null>(null)
  const [hovered, setHovered] = useState<RatingValue | null>(null)
  const [phase, setPhase] = useState<'idle' | 'submitted'>('idle')
  const thanksOpacity = useRef(new Animated.Value(0)).current
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset all state when the sheet is dismissed / re-opened, so a repeat
  // trigger later in the session doesn't show a stale "Thanks!" flash.
  useEffect(() => {
    if (!visible) {
      setSelected(null)
      setHovered(null)
      setPhase('idle')
      thanksOpacity.setValue(0)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [visible, thanksOpacity])

  const title =
    targetType === 'city'
      ? t('ratings.prompt.titleCity', { name: entityName ?? '' })
      : targetType === 'place'
        ? t('ratings.prompt.titlePlace', { name: entityName ?? '' })
        : t('ratings.prompt.titleExcursion')

  const onPickStar = useCallback(
    async (value: RatingValue) => {
      // Locked out after first tap — don't process re-taps mid-transition.
      if (phase !== 'idle') return

      if (!isSignedIn) {
        onClose()
        await clearAuthChoice()
        router.push(LOGIN_HREF)
        return
      }

      // 1. Lock in the visual immediately so the user's tap feels registered.
      setSelected(value)
      setPhase('submitted')

      // 2. Fade in the "Thanks!" line to reinforce the selection.
      Animated.timing(thanksOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start()

      // 3. Schedule the close. We fire the network write in parallel — if it
      //    errors, we surface a toast but still close (the optimistic cache
      //    update in the hook keeps the UI honest until the real /me refetch).
      closeTimeoutRef.current = setTimeout(() => {
        onClose()
      }, CONFIRMATION_HOLD_MS)

      try {
        await submit(targetType, targetId, value)
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
          onClose()
          await clearAuthChoice()
          router.push(LOGIN_HREF)
          return
        }
        toast.show(t('common.somethingWentWrong'))
      }
    },
    [
      phase,
      isSignedIn,
      submit,
      targetType,
      targetId,
      toast,
      t,
      router,
      onClose,
      thanksOpacity,
    ],
  )

  // Star fill logic:
  //   - While actively pressing, follow the finger (hovered)
  //   - After tap-and-release / auto-fill, hold at `selected`
  const litUpTo = hovered ?? selected ?? 0

  return (
    <BottomSheet visible={visible} onClose={onClose} heightRatio={0.42}>
      <YStack px="$5" py="$4" gap="$4" flex={1}>
        <YStack gap="$2">
          <H2 color="$color" fontFamily="$heading" fontWeight="700" fontSize="$7">
            {title}
          </H2>
          <Paragraph
            color="$colorPress"
            fontFamily="$body"
            size="$3"
            lineHeight="$5"
          >
            {t('ratings.prompt.subtitle')}
          </Paragraph>
        </YStack>

        <XStack justify="center" gap="$3" py="$4">
          {STAR_VALUES.map((v) => {
            const isLit = v <= litUpTo
            return (
              <Pressable
                key={v}
                onPress={() => onPickStar(v)}
                onPressIn={() => phase === 'idle' && setHovered(v)}
                onPressOut={() => setHovered(null)}
                disabled={phase !== 'idle'}
                hitSlop={6}
              >
                <Star
                  size={44}
                  color={isLit ? (STAR_FILLED as any) : (STAR_OUTLINE as any)}
                  fill={isLit ? (STAR_FILLED as any) : 'transparent'}
                />
              </Pressable>
            )
          })}
        </XStack>

        <Animated.View style={{ opacity: thanksOpacity, alignItems: 'center' }}>
          <SizableText
            color="$primary"
            fontFamily="$body"
            fontWeight="600"
            size="$4"
          >
            {t('ratings.prompt.thanks')}
          </SizableText>
        </Animated.View>

        {phase === 'idle' && (
          <Pressable onPress={onClose}>
            <YStack items="center" py="$2">
              <SizableText color="$colorPress" fontFamily="$body" fontWeight="500">
                {t('ratings.prompt.skip')}
              </SizableText>
            </YStack>
          </Pressable>
        )}
      </YStack>
    </BottomSheet>
  )
}
