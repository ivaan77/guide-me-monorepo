import { Image, Pressable, ScrollView } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { BookOpen } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import { useStories } from '../../hooks/useStories'
import { SHADOW } from '../../constants/Sizes'
import { useAppTheme } from '../../providers/ThemeContext'

const H_PADDING = 20
const GUTTER = 12
const CARD_WIDTH = 260

// Renders the "Related stories" row on CityDetailScreen. Fetches the
// posts tied to this city's slug and displays them as a horizontal
// carousel of small cards. Silent-null on every failure path — a city
// with no related stories renders NOTHING (no empty state), so we don't
// dilute the CityDetail screen with an empty-looking section.
export function RelatedStories({ citySlug }: { citySlug: string }) {
  const { t, i18n } = useTranslation()
  const { c } = useAppTheme()
  const { data: posts, isError } = useStories({ citySlug })

  // Silent-null: no city slug (shouldn't happen — caller enforces),
  // fetch error, or empty result. Better to hide the section entirely
  // than show a "no results" affordance on a screen already dense with
  // categories.
  if (isError) return null
  if (!posts || posts.length === 0) return null

  return (
    <YStack gap="$3" pt="$4">
      <XStack items="center" gap="$2" px={H_PADDING}>
        <BookOpen size={18} color={c.text as any} />
        <SizableText size="$6" fontFamily="$body" fontWeight="700" color={c.text as any}>
          {t('stories.relatedTitle')}
        </SizableText>
      </XStack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          gap: GUTTER,
        }}
      >
        {/* Cap at the first 8 stories the API returned — the list-view
            hook already limits to 20; capping here keeps the horizontal
            row bounded so the user isn't wasting scroll on a wall of
            cards inside a nested scroll. */}
        {posts.slice(0, 8).map((post) => {
            const dateFmt = new Intl.DateTimeFormat(i18n.language, {
              day: 'numeric',
              month: 'short',
            }).format(new Date(post.publishedAt))
            return (
              <Link key={post.slug} href={`/story/${post.slug}`} asChild>
                <Pressable style={{ width: CARD_WIDTH }}>
                  <YStack
                    bg={c.surface as any}
                    rounded="$5"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor={c.border as any}
                    style={SHADOW.card}
                  >
                    <Image
                      source={{ uri: post.coverImage }}
                      style={{ width: '100%', aspectRatio: 16 / 9 }}
                      resizeMode="cover"
                    />
                    <YStack p="$3" gap="$1">
                      <SizableText
                        size="$1"
                        fontFamily="$body"
                        fontWeight="700"
                        color={c.primary as any}
                        style={{
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {t(`stories.category.${post.category}` as const)} ·{' '}
                        {dateFmt}
                      </SizableText>
                      <SizableText
                        size="$4"
                        fontFamily="$body"
                        fontWeight="700"
                        color={c.text as any}
                        numberOfLines={2}
                      >
                        {post.title}
                      </SizableText>
                      <SizableText
                        size="$2"
                        fontFamily="$body"
                        color={c.textMuted as any}
                        numberOfLines={2}
                      >
                        {post.excerpt}
                      </SizableText>
                    </YStack>
                  </YStack>
                </Pressable>
              </Link>
            )
          })}
      </ScrollView>
    </YStack>
  )
}
