import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { Heart } from '@tamagui/lucide-icons'
import { Spinner, YStack } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { useTranslation } from 'react-i18next'
import type { FavoriteRef } from '@guide-me-app/core'
import { useToggleFavorite } from '../hooks/useToggleFavorite'
import { UnauthorizedError } from '../lib/authedApi'
import { clearAuthChoice } from '../providers/AuthChoice'

type Props = {
  refToFavorite: FavoriteRef
  // Heart icon color when NOT a favorite (sits on a media chrome by default).
  inactiveColor?: string
  // Heart icon color when active (filled).
  activeColor?: string
  // Background style — "chrome" gives a translucent dark pill matching the
  // back-button on hero images; "transparent" is no chrome (header use).
  variant?: 'chrome' | 'transparent'
}

const LOGIN_HREF = '/login' as Href

export function FavoriteButton({
  refToFavorite,
  inactiveColor,
  activeColor,
  variant = 'chrome',
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToastController()
  const { isFavorite, toggle, isPending } = useToggleFavorite()
  const active = isFavorite(refToFavorite)

  const onPress = useCallback(async () => {
    try {
      await toggle(refToFavorite)
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        // Mirror the Profile screen's sign-in flow — clear the prior "skipped"
        // choice and push to the full /login screen.
        await clearAuthChoice()
        router.push(LOGIN_HREF)
        return
      }
      toast.show(t('common.somethingWentWrong'))
    }
  }, [toggle, refToFavorite, router, t, toast])

  const iconActive = activeColor ?? '#FF7A59' // coral accent for filled state
  const iconInactive = inactiveColor ?? '#FFFFFF'

  return (
    <Pressable onPress={onPress} hitSlop={8} disabled={isPending}>
      <YStack
        width={40}
        height={40}
        rounded={20}
        items="center"
        justify="center"
        bg={variant === 'chrome' ? '$chromeOverlay' : 'transparent'}
        opacity={isPending ? 0.6 : 1}
      >
        {isPending ? (
          <Spinner color={iconInactive as any} />
        ) : (
          <Heart
            size={22}
            color={active ? (iconActive as any) : (iconInactive as any)}
            fill={active ? (iconActive as any) : 'transparent'}
          />
        )}
      </YStack>
    </Pressable>
  )
}
