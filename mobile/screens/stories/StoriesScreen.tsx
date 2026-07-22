import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { SizableText, XStack, YStack } from 'tamagui'
import { BLOG_CATEGORIES, type BlogCategory } from '@guide-me-app/core'
import { useCities } from '../../hooks/useCities'
import { useStories } from '../../hooks/useStories'
import { useTabBarPadding } from '../../hooks/useTabBarPadding'
import { useAppTheme } from '../../providers/ThemeContext'
import { StoryCard } from './StoryCard'

const H_PADDING = 20

// Simple vertically-scrolling list of story cards. Category filter chips
// at the top switch the fetch. No pagination on mobile for now — the
// hook grabs the first 20 posts; if the blog grows past that we'll add
// infinite scroll (React Query's useInfiniteQuery).
export function StoriesScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const tabPad = useTabBarPadding()
  const { c } = useAppTheme()
  const [category, setCategory] = useState<BlogCategory | undefined>(undefined)
  const [citySlug, setCitySlug] = useState<string | undefined>(undefined)
  const { data: cities } = useCities()
  const {
    data: posts,
    isLoading,
    isError,
  } = useStories({ category, citySlug })

  return (
    <YStack flex={1} bg={c.background as any} pt={insets.top}>
      <YStack px={H_PADDING} pt="$4" pb="$3">
        <SizableText
          size="$9"
          fontFamily="$heading"
          fontWeight="800"
          color={c.text as any}
        >
          {t('stories.title')}
        </SizableText>
      </YStack>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[undefined, ...BLOG_CATEGORIES] as (BlogCategory | undefined)[]}
        keyExtractor={(item) => item ?? '__all'}
        contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: 8 }}
        style={{ flexGrow: 0, marginBottom: 8 }}
        renderItem={({ item }) => (
          <Chip
            label={
              item ? t(`stories.category.${item}` as const) : t('stories.all')
            }
            active={category === item}
            onPress={() => setCategory(item)}
          />
        )}
      />
      {/* City filter chip strip. Only surface when there are 2+ cities;
          a single-city app doesn't need the affordance. Keeps the header
          uncluttered pre-launch when only Zagreb is live. */}
      {cities && cities.length >= 2 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[undefined, ...cities.map((city) => city.id)] as (string | undefined)[]}
          keyExtractor={(item) => item ?? '__all-cities'}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: 8 }}
          style={{ flexGrow: 0, marginBottom: 12 }}
          renderItem={({ item }) => (
            <Chip
              label={
                item
                  ? cities.find((city) => city.id === item)?.name ?? item
                  : t('stories.allCities')
              }
              active={citySlug === item}
              onPress={() => setCitySlug(item)}
            />
          )}
        />
      )}
      {isLoading ? (
        <YStack flex={1} items="center" justify="center">
          <ActivityIndicator />
        </YStack>
      ) : isError || !posts ? (
        <YStack flex={1} items="center" justify="center" px={H_PADDING}>
          <SizableText size="$3" fontFamily="$body" color={c.textMuted as any} text="center">
            {t('stories.errorBody')}
          </SizableText>
        </YStack>
      ) : posts.length === 0 ? (
        <YStack flex={1} items="center" justify="center" px={H_PADDING}>
          <SizableText size="$3" fontFamily="$body" color={c.textMuted as any} text="center">
            {t('stories.emptyBody')}
          </SizableText>
        </YStack>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING,
            paddingBottom: tabPad + 24,
            gap: 16,
          }}
          renderItem={({ item }) => <StoryCard post={item} />}
        />
      )}
    </YStack>
  )
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const { c } = useAppTheme()
  return (
    <Pressable onPress={onPress}>
      <XStack
        px="$3"
        py="$1.5"
        rounded={9999}
        bg={(active ? c.primary : c.surfaceMuted) as any}
      >
        <SizableText
          size="$2"
          fontFamily="$body"
          fontWeight="700"
          color={(active ? c.onBrand : c.text) as any}
        >
          {label}
        </SizableText>
      </XStack>
    </Pressable>
  )
}
