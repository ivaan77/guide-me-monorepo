import { useCallback, useMemo } from 'react'
import { Image, Pressable, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo'
import { useTranslation } from 'react-i18next'
import { useRouter, type Href } from 'expo-router'
import { Button, H2, H3, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import {
  ChevronRight,
  Compass,
  Heart,
  MapPin,
  Store,
} from '@tamagui/lucide-icons'
import type { FavoriteRef } from '@guide-me-app/core'
import { clearAuthChoice } from '../../providers/AuthChoice'
import { useMe } from '../../hooks/useMe'
import { useCity } from '../../hooks/useCity'
import { useExcursion } from '../../hooks/useExcursion'
import { usePlace } from '../../hooks/usePlace'
import { useTabBarPadding } from '../../hooks/useTabBarPadding'
import { EmptyState } from '../discover/EmptyState'

const LOGIN_HREF = '/login' as Href
const H_PADDING = 20

export function FavoritesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isSignedIn } = useAuth()
  const { data: me, isPending, isError, refetch } = useMe()

  const onSignIn = useCallback(async () => {
    await clearAuthChoice()
    router.push(LOGIN_HREF)
  }, [router])

  const sections = useMemo(() => groupByType(me?.favorites ?? []), [me?.favorites])
  const bottomPadding = useTabBarPadding()

  // Single outer Tamagui-themed canvas so theme changes propagate through
  // tokens, not raw RN style props. We then put a ScrollView inside ONLY
  // when there's enough content to scroll; otherwise we render a centered
  // YStack so the empty / guest states sit visually in the middle.

  if (!isSignedIn) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 8}>
        <YStack flex={1} items="center" justify="center" px="$6" gap="$3">
          <Heart size={48} color="$primary" />
          <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
            {t('favorites.signInRequiredTitle')}
          </H2>
          <Paragraph
            color="$colorPress"
            text="center"
            fontFamily="$body"
            size="$4"
            max-width={320}
          >
            {t('favorites.signInRequiredBody')}
          </Paragraph>
          <Button
            size="$4"
            mt="$3"
            bg="$primary"
            color="$background"
            fontFamily="$heading"
            fontWeight="700"
            onPress={onSignIn}
          >
            {t('profile.signIn')}
          </Button>
        </YStack>
      </YStack>
    )
  }

  if (isPending) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 8}>
        <YStack
          gap="$2"
          px={H_PADDING}
          pt="$3"
        >
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  if (isError) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 8}>
        <EmptyState variant="error" onRetry={() => refetch()} />
      </YStack>
    )
  }

  if (!me || me.favorites.length === 0) {
    return (
      <YStack flex={1} bg="$background" pt={insets.top + 8}>
        <YStack flex={1} items="center" justify="center" px="$6" gap="$3">
          <Heart size={48} color="$primary" />
          <H2 color="$color" fontFamily="$body" fontWeight="600" fontSize="$8">
            {t('favorites.emptyTitle')}
          </H2>
          <Paragraph color="$colorPress" text="center" fontFamily="$body" size="$4">
            {t('favorites.emptyBody')}
          </Paragraph>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} bg="$background" pt={insets.top}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          paddingTop: 12,
          paddingBottom: bottomPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$6">
          {sections.cities.length > 0 && (
            <Section title={t('favorites.sections.cities')} icon={MapPin}>
              {sections.cities.map((ref) => (
                <CityRow key={ref.id} id={ref.id} />
              ))}
            </Section>
          )}
          {sections.excursions.length > 0 && (
            <Section title={t('favorites.sections.excursions')} icon={Compass}>
              {sections.excursions.map((ref) => (
                <ExcursionRow key={ref.id} id={ref.id} />
              ))}
            </Section>
          )}
          {sections.places.length > 0 && (
            <Section title={t('favorites.sections.places')} icon={Store}>
              {sections.places.map((ref) => (
                <PlaceRow key={ref.id} id={ref.id} />
              ))}
            </Section>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

function groupByType(favorites: FavoriteRef[]) {
  return {
    cities: favorites.filter((f) => f.type === 'city'),
    excursions: favorites.filter((f) => f.type === 'excursion'),
    places: favorites.filter((f) => f.type === 'place'),
  }
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof MapPin
  children: React.ReactNode
}) {
  return (
    <YStack gap="$2">
      <XStack items="center" gap="$2">
        <Icon size={16} color="$colorPress" />
        <SizableText
          size="$2"
          color="$colorPress"
          fontFamily="$body"
          fontWeight="600"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
        >
          {title}
        </SizableText>
      </XStack>
      <YStack gap="$2">{children}</YStack>
    </YStack>
  )
}

function CityRow({ id }: { id: string }) {
  const router = useRouter()
  const { data: city, isPending } = useCity(id)
  if (isPending || !city) return <RowSkeleton />
  return (
    <Row
      title={city.name}
      subtitle={city.country}
      image={city.image}
      onPress={() => router.push(`/city/${id}` as Href)}
    />
  )
}

function ExcursionRow({ id }: { id: string }) {
  const router = useRouter()
  const { data: excursion, isPending } = useExcursion(id)
  if (isPending || !excursion) return <RowSkeleton />
  return (
    <Row
      title={excursion.name}
      subtitle={excursion.meta}
      image={excursion.image}
      onPress={() => router.push(`/excursion/${id}` as Href)}
    />
  )
}

function PlaceRow({ id }: { id: string }) {
  const router = useRouter()
  const { data: place, isPending } = usePlace(id)
  if (isPending || !place) return <RowSkeleton />
  return (
    <Row
      title={place.name}
      subtitle={place.meta}
      image={place.image}
      onPress={() => router.push(`/place/${id}` as Href)}
    />
  )
}

function Row({
  title,
  subtitle,
  image,
  onPress,
}: {
  title: string
  subtitle: string
  image: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        items="center"
        gap="$3"
        p="$2"
        rounded="$4"
        bg="$surface"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Image
          source={{ uri: image }}
          style={{ width: 56, height: 56, borderRadius: 10 }}
          resizeMode="cover"
        />
        <YStack flex={1} gap="$0.5">
          <H3
            color="$color"
            fontFamily="$body"
            fontWeight="600"
            fontSize="$5"
            numberOfLines={1}
          >
            {title}
          </H3>
          <SizableText
            size="$3"
            color="$colorPress"
            fontFamily="$body"
            numberOfLines={1}
          >
            {subtitle}
          </SizableText>
        </YStack>
        <ChevronRight size={18} color="$colorPress" />
      </XStack>
    </Pressable>
  )
}

function RowSkeleton() {
  return (
    <XStack
      items="center"
      gap="$3"
      p="$2"
      rounded="$4"
      bg="$surface"
      borderWidth={1}
      borderColor="$borderColor"
      opacity={0.5}
    >
      <YStack width={56} height={56} rounded={10} bg="$surfaceMuted" />
      <YStack flex={1} gap="$2">
        <YStack height={14} width="60%" rounded={4} bg="$surfaceMuted" />
        <YStack height={12} width="40%" rounded={4} bg="$surfaceMuted" />
      </YStack>
    </XStack>
  )
}
