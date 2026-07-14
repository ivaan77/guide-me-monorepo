import { Image, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SizableText, XStack, YStack } from 'tamagui'
import type { BlogCategory, PublicBlogSummary } from '@guide-me-app/core'
import { SHADOW } from '../../constants/Sizes'

type Props = {
  post: PublicBlogSummary
}

// Card used in the Stories tab list. Cover, category badge + date +
// reading time strip, title, excerpt (2 lines). Whole card is a tap
// target to /story/[slug].
export function StoryCard({ post }: Props) {
  const { t, i18n } = useTranslation()
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(post.publishedAt))

  return (
    <Link href={`/story/${post.slug}`} asChild>
      <Pressable>
        <YStack
          bg="$surface"
          rounded="$6"
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
          style={SHADOW.card}
        >
          <Image
            source={{ uri: post.coverImage }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            resizeMode="cover"
          />
          <YStack p="$4" gap="$2">
            <XStack items="center" gap="$2">
              <SizableText
                size="$1"
                fontFamily="$body"
                fontWeight="700"
                color="$primary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {t(`stories.category.${post.category}` as const)}
              </SizableText>
              <SizableText size="$2" fontFamily="$body" color="$colorPress">
                · {dateFmt}
              </SizableText>
              {post.readingMinutes && (
                <SizableText size="$2" fontFamily="$body" color="$colorPress">
                  · {t('stories.readingMinutes', { count: post.readingMinutes })}
                </SizableText>
              )}
            </XStack>
            <SizableText
              size="$6"
              fontFamily="$body"
              fontWeight="700"
              color="$color"
              numberOfLines={2}
            >
              {post.title}
            </SizableText>
            <SizableText
              size="$3"
              fontFamily="$body"
              color="$colorPress"
              numberOfLines={2}
            >
              {post.excerpt}
            </SizableText>
          </YStack>
        </YStack>
      </Pressable>
    </Link>
  )
}

// Kept here so callers can reuse the same label mapping when they need it.
export const STORY_CATEGORY_LABELS_KEYS: Record<BlogCategory, string> = {
  'travel-tips': 'stories.category.travel-tips',
  'city-guide': 'stories.category.city-guide',
  'food-drink': 'stories.category.food-drink',
  news: 'stories.category.news',
}
