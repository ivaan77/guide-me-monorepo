import { Fragment, type ReactNode } from 'react'
import { Image, Linking, Pressable, View } from 'react-native'
import { Link } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Info, Lightbulb, Play } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type {
  AppLinkKind,
  EditorPickVariant,
  TipTapDoc,
} from '@guide-me-app/core'
import { SHADOW } from '../../constants/Sizes'
import { useAppTheme } from '../../providers/ThemeContext'
import type Colors from '../../constants/Colors'

// React-Native renderer for TipTap JSON. Mirrors the web renderer's
// supported node set + walking approach, but emits Tamagui / RN
// primitives. Unknown nodes render null (same defensive posture).

type ThemeColors = (typeof Colors)['light']

type TipTapNode = {
  type?: string
  content?: TipTapNode[]
  attrs?: Record<string, unknown>
  text?: string
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
}

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/

function extractYoutubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = YOUTUBE_ID_RE.exec(url)
  return m?.[1] ?? null
}

// Render inline text runs (paragraphs / headings / list items). Wraps
// text in mark-aware Tamagui components so bold/italic/link show up.
function renderInlineChildren(
  nodes: TipTapNode[] | undefined,
  c: ThemeColors,
): ReactNode {
  if (!nodes) return null
  return nodes.map((n, i) => (
    <Fragment key={i}>{renderInlineNode(n, c)}</Fragment>
  ))
}

function renderInlineNode(node: TipTapNode, c: ThemeColors): ReactNode {
  if (node.type === 'text') {
    const text = node.text ?? ''
    // Fold marks in the order they appear on the node. Link mark
    // becomes a Pressable that opens the URL in the system browser.
    let element: ReactNode = text
    let isBold = false
    let isItalic = false
    let href: string | undefined
    for (const mark of node.marks ?? []) {
      if (mark.type === 'bold') isBold = true
      if (mark.type === 'italic') isItalic = true
      if (mark.type === 'link') {
        href = mark.attrs?.href as string | undefined
      }
    }
    if (isBold || isItalic) {
      element = (
        <SizableText
          fontFamily="$body"
          fontWeight={isBold ? '700' : '400'}
          fontStyle={isItalic ? 'italic' : 'normal'}
          color={c.text as any}
        >
          {element}
        </SizableText>
      )
    }
    if (href) {
      element = (
        <SizableText
          fontFamily="$body"
          color={c.primary as any}
          onPress={() => Linking.openURL(href!).catch(() => undefined)}
          style={{ textDecorationLine: 'underline' }}
        >
          {element}
        </SizableText>
      )
    }
    return element
  }
  if (node.type === 'hardBreak') return '\n'
  return null
}

// Block-level walker: paragraphs, headings, lists, blockquote, image,
// youtube, horizontalRule, appLink.
function renderBlockNode(
  node: TipTapNode,
  i: number,
  t: TranslateFn,
  c: ThemeColors,
): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <SizableText
          key={i}
          size="$4"
          fontFamily="$body"
          color={c.text as any}
          style={{ marginBottom: 12, lineHeight: 24 }}
        >
          {renderInlineChildren(node.content, c)}
        </SizableText>
      )
    case 'heading': {
      const level = (node.attrs?.level as number | undefined) ?? 2
      const size = level === 2 ? '$8' : '$6'
      return (
        <SizableText
          key={i}
          size={size}
          fontFamily="$heading"
          fontWeight="700"
          color={c.text as any}
          style={{ marginTop: level === 2 ? 24 : 16, marginBottom: 8 }}
        >
          {renderInlineChildren(node.content, c)}
        </SizableText>
      )
    }
    case 'bulletList':
      return (
        <YStack key={i} gap="$1" style={{ marginBottom: 12 }}>
          {(node.content ?? []).map((li, li_i) => (
            <XStack key={li_i} gap="$2" pl="$2">
              <SizableText size="$4" color={c.text as any}>•</SizableText>
              <YStack flex={1}>
                {(li.content ?? []).map((child, c_i) => (
                  <Fragment key={c_i}>{renderBlockNode(child, c_i, t, c)}</Fragment>
                ))}
              </YStack>
            </XStack>
          ))}
        </YStack>
      )
    case 'orderedList':
      return (
        <YStack key={i} gap="$1" style={{ marginBottom: 12 }}>
          {(node.content ?? []).map((li, li_i) => (
            <XStack key={li_i} gap="$2" pl="$2">
              <SizableText size="$4" color={c.text as any}>{li_i + 1}.</SizableText>
              <YStack flex={1}>
                {(li.content ?? []).map((child, c_i) => (
                  <Fragment key={c_i}>{renderBlockNode(child, c_i, t, c)}</Fragment>
                ))}
              </YStack>
            </XStack>
          ))}
        </YStack>
      )
    case 'blockquote':
      return (
        <View
          key={i}
          style={{
            borderLeftWidth: 4,
            paddingLeft: 12,
            marginVertical: 12,
            opacity: 0.8,
          }}
        >
          {(node.content ?? []).map((child, c_i) => (
            <Fragment key={c_i}>{renderBlockNode(child, c_i, t, c)}</Fragment>
          ))}
        </View>
      )
    case 'image': {
      const src = node.attrs?.src as string | undefined
      if (!src) return null
      return (
        <Image
          key={i}
          source={{ uri: src }}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: 12,
            marginVertical: 12,
          }}
          resizeMode="cover"
        />
      )
    }
    case 'youtube': {
      const src = node.attrs?.src as string | undefined
      const id = extractYoutubeId(src)
      if (!id) return null
      // No in-app YouTube player wired yet — tap opens the system
      // YouTube app or browser via Linking. Thumbnail alone doesn't
      // communicate "video, tap to play" clearly enough, so we overlay
      // a centered red play badge (YouTube's own visual convention).
      const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      const openUrl = `https://www.youtube.com/watch?v=${id}`
      return (
        <Pressable
          key={i}
          onPress={() => Linking.openURL(openUrl).catch(() => undefined)}
          style={{ marginVertical: 12, position: 'relative' }}
        >
          <Image
            source={{ uri: thumb }}
            style={{
              width: '100%',
              aspectRatio: 16 / 9,
              borderRadius: 12,
            }}
            resizeMode="cover"
          />
          {/* Play badge — dark translucent bg dims the thumbnail so the
              button reads even on light images; red circle + white play
              icon matches YouTube's own conventions so users know what
              tapping does. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: '#E53935',
                alignItems: 'center',
                justifyContent: 'center',
                // Small shadow so the badge lifts off the thumbnail
                // even when the thumbnail is red-heavy.
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              {/* Nudged 3px right so the visual center of the play
                  triangle sits at the center of the circle (the
                  triangle's optical center is offset from its
                  geometric center). */}
              <Play
                size={30}
                color="#FFFFFF"
                fill="#FFFFFF"
                style={{ marginLeft: 3 }}
              />
            </View>
          </View>
        </Pressable>
      )
    }
    case 'horizontalRule':
      return (
        <View
          key={i}
          style={{
            height: 1,
            backgroundColor: 'rgba(128,128,128,0.25)',
            marginVertical: 20,
          }}
        />
      )
    case 'appLink': {
      const kind = node.attrs?.kind as AppLinkKind | undefined
      const id = node.attrs?.id as string | undefined
      const label = (node.attrs?.label as string | undefined) ?? ''
      const imageUrl = node.attrs?.imageUrl as string | undefined
      if (!kind || !id) return null
      const href =
        kind === 'city'
          ? `/city/${id}`
          : kind === 'place'
            ? `/place/${id}`
            : `/excursion/${id}`
      return (
        <Link key={i} href={href as never} asChild>
          <Pressable>
            <XStack
              items="center"
              gap="$3"
              p="$3"
              rounded="$5"
              bg={c.surface as any}
              borderWidth={1}
              borderColor={c.border as any}
              style={{ marginVertical: 16, ...SHADOW.card }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    backgroundColor: 'rgba(128,128,128,0.15)',
                  }}
                />
              )}
              <YStack flex={1} gap="$0.5">
                <SizableText
                  size="$1"
                  fontFamily="$body"
                  fontWeight="700"
                  color={c.primary as any}
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  {t(`stories.appLink.${kind}` as const)}
                </SizableText>
                <SizableText
                  size="$4"
                  fontFamily="$body"
                  fontWeight="700"
                  color={c.text as any}
                  numberOfLines={2}
                >
                  {label}
                </SizableText>
              </YStack>
              <SizableText size="$5" color={c.textMuted as any}>›</SizableText>
            </XStack>
          </Pressable>
        </Link>
      )
    }
    case 'editorPick': {
      const variant = node.attrs?.variant as EditorPickVariant | undefined
      const title = (node.attrs?.title as string | undefined) ?? ''
      const body = (node.attrs?.body as string | undefined) ?? ''
      if (!variant || (!title && !body)) return null
      const isTip = variant === 'tip'
      // Solid, unambiguous card colors: yellow for tip, blue for
      // highlight. Icon lives in a filled circular badge on the left so
      // the card reads as an intentional callout, not a lightly-tinted
      // paragraph.
      const bg = isTip ? '#FFF4DA' : '#E6EFFE'
      const border = isTip ? '#F9C86A' : '#93B4F5'
      const badgeBg = isTip ? '#F59E0B' : '#3B82F6'
      const accent = isTip ? '#92400E' : '#1E3A8A'
      const Icon = isTip ? Lightbulb : Info
      return (
        <XStack
          key={i}
          items="center"
          gap="$3"
          p="$4"
          rounded="$5"
          borderWidth={2}
          style={{
            backgroundColor: bg,
            borderColor: border,
            marginVertical: 12,
          }}
        >
          {/* Left column: solid-color circular icon badge. Fixed width so
              longer body copy wraps under the text column, not the icon. */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: badgeBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color="#FFFFFF" />
          </View>
          <YStack flex={1} gap="$1">
            <SizableText
              size="$1"
              fontFamily="$body"
              fontWeight="700"
              style={{
                color: accent,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {t(`stories.editorPick.${variant}` as const)}
            </SizableText>
            {title && (
              <SizableText
                size="$5"
                fontFamily="$body"
                fontWeight="700"
                style={{ color: accent }}
              >
                {title}
              </SizableText>
            )}
            {body && (
              <SizableText
                size="$3"
                fontFamily="$body"
                style={{ color: accent, lineHeight: 20 }}
              >
                {body}
              </SizableText>
            )}
          </YStack>
        </XStack>
      )
    }
    default:
      // Unknown node type — quietly drop it. Matches the web renderer's
      // defensive posture.
      return null
  }
}

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string

export function TipTapRenderer({ doc }: { doc: TipTapDoc | undefined }) {
  const { t } = useTranslation()
  const { c } = useAppTheme()
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return null
  return (
    <>
      {(doc.content as TipTapNode[]).map((n, i) => (
        <Fragment key={i}>{renderBlockNode(n, i, t as TranslateFn, c)}</Fragment>
      ))}
    </>
  )
}
