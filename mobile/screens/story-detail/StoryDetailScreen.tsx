import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { usePostHog } from 'posthog-react-native'
import { ArrowUp, ChevronLeft } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import { useStory } from '../../hooks/useStories'
import { TipTapRenderer } from './TipTapRenderer'
import { SHADOW } from '../../constants/Sizes'

const H_PADDING = 20

// Story detail screen — cover, meta, title, excerpt, TipTap body.
// Emits `story_viewed` on first successful load per (slug, category)
// combo. Uses useEffect gated on data so we only fire once the payload
// is real.
export function StoryDetailScreen({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const { height: winH } = useWindowDimensions()
  const posthog = usePostHog()
  const { data: post, isLoading, isError } = useStory(slug)

  // Scroll-to-top FAB. Threshold: user has scrolled past ~60% of screen
  // height. Animated.Value on the opacity means we fade in/out instead
  // of flash-in on the first eligible scroll event.
  const scrollRef = useRef<ScrollView>(null)
  const [fabVisible, setFabVisible] = useState(false)
  const fabOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fabOpacity, {
      toValue: fabVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [fabVisible, fabOpacity])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const y = e.nativeEvent.contentOffset.y
    const threshold = winH * 0.6
    // Hysteresis: show above 60vh, hide below 55vh. Prevents the FAB
    // from flickering on/off if the user scrolls right at the boundary.
    const next = fabVisible ? y > threshold - winH * 0.05 : y > threshold
    if (next !== fabVisible) setFabVisible(next)
  }

  const scrollToTop = (): void => {
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  useEffect(() => {
    if (!post || !posthog) return
    posthog.capture('story_viewed', {
      slug: post.slug,
      category: post.category,
      // Only include reading_minutes when the server actually computed one
      // (empty articles omit it). PostHog rejects `undefined` values.
      ...(post.readingMinutes !== undefined
        ? { reading_minutes: post.readingMinutes }
        : {}),
    })
    // Fire once per (post) — if the user scrubs between stories, each
    // gets its own event. useStory returns a NEW `post` object per slug
    // so the effect naturally re-runs when the user opens a different
    // story, not merely on locale/etc. changes.
  }, [post, posthog])

  if (isLoading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <ActivityIndicator />
      </YStack>
    )
  }

  if (isError || !post) {
    return (
      <YStack
        flex={1}
        bg="$background"
        items="center"
        justify="center"
        px={H_PADDING}
      >
        <SizableText size="$4" fontFamily="$body" color="$colorPress" text="center">
          {t('stories.errorBody')}
        </SizableText>
      </YStack>
    )
  }

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(post.publishedAt))

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        // 16ms ≈ 60fps. Cheap enough that we don't miss the threshold
        // crossing on a fast scroll, expensive-enough-not to churn.
        scrollEventThrottle={16}
      >
        <Image
          source={{ uri: post.coverImage }}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          resizeMode="cover"
        />
        <YStack px={H_PADDING} pt="$5" gap="$3">
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
          {/* $10 was too tall on phones — a two-line title took roughly a
              third of the initial viewport. $8 is the standard "display"
              size we use for large screen titles elsewhere, and pairs
              better with the excerpt below. */}
          <SizableText
            size="$8"
            fontFamily="$heading"
            fontWeight="800"
            color="$color"
            style={{ lineHeight: 34 }}
          >
            {post.title}
          </SizableText>
          <SizableText
            size="$5"
            fontFamily="$body"
            color="$colorPress"
            style={{ lineHeight: 26, marginBottom: 8 }}
          >
            {post.excerpt}
          </SizableText>
          <YStack>
            <TipTapRenderer doc={post.body} />
          </YStack>
        </YStack>
      </ScrollView>

      {/* Back chevron floats over the cover image. Matches the style used
          on CityDetailScreen / PlaceDetailScreen. */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOW.card,
        }}
      >
        <ChevronLeft size={24} color="#1F2937" />
      </Pressable>

      {/* Scroll-to-top FAB. Bottom-right, safe-area aware, fades in
          once the user has scrolled past ~60vh. pointerEvents flips
          with visibility so an invisible-but-not-yet-faded button
          doesn't intercept taps on the article beneath. */}
      <Animated.View
        pointerEvents={fabVisible ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          right: 16,
          bottom: insets.bottom + 16,
          opacity: fabOpacity,
        }}
      >
        <Pressable
          onPress={scrollToTop}
          accessibilityLabel="Scroll to top"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#0B1F3A',
            alignItems: 'center',
            justifyContent: 'center',
            ...SHADOW.card,
          }}
        >
          <ArrowUp size={22} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </YStack>
  )
}
