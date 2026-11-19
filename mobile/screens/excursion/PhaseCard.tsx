import { Pressable, ScrollView } from 'react-native'
import { SizableText, XStack, YStack } from 'tamagui'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'
import { useAppTheme } from '../../providers/ThemeContext'

// Shared card shape for every ExcursionScreen bottom panel. Enforces:
//   - identical outer container (rounded, padded, shadowed the same way)
//   - a common Header / Body / Actions region layout
//   - a phase tint applied to the header badge so the user reads phase at
//     a glance without re-reading the title copy
//
// Individual phase panels compose these primitives. This lets us keep
// phase-specific content (image, distance, description, chips) inside
// the Body slot while the structural shape stays constant. See docs at
// the top of ExcursionScreen for the redesign context.

// Colors sourced from the existing palette + the violet already used for
// bundle pins (StopBundlePin.tsx BUNDLE_ACCENT). Keeps the color set the
// user is already trained on; no new tokens.
export const PHASE_ACCENT = {
  preview: palette.navy,
  navigating: palette.primary,
  arrived: palette.amber,
  // Bundle sub-stop uses the same violet as the map bundle pin so the two
  // reinforce each other — user sees violet on the pin, sees violet on the
  // card, understands "these are the same conceptual thing."
  bundle: '#7C3AED',
  outro: palette.coral,
  complete: palette.success,
} as const

export type PhaseAccentKind = keyof typeof PHASE_ACCENT

// Foreground color that reads on the tint. Amber wants dark ink; the
// others take white. Kept in a lookup so the caller doesn't have to think
// about contrast.
const PHASE_ON_ACCENT: Record<PhaseAccentKind, string> = {
  preview: '#FFFFFF',
  navigating: '#FFFFFF',
  arrived: palette.navy,
  bundle: '#FFFFFF',
  outro: '#FFFFFF',
  complete: '#FFFFFF',
}

type CardProps = {
  children: React.ReactNode
}

// Outer wrapper. Rounded card, subtle lift, phase-agnostic padding.
// The phase tint lives on PhaseCardHeader (badge chip) and PhaseCardActions
// (button color), not on the card itself — so the wrapper takes no accent.
export function PhaseCard({ children }: CardProps) {
  const { c } = useAppTheme()
  return (
    <YStack
      bg={c.surface as any}
      rounded="$6"
      p="$3"
      gap="$3"
      borderWidth={1}
      borderColor={c.border as any}
      // Allow the card to shrink inside ExcursionScreen's height-capped
      // container so PhaseCardBody's ScrollView has a bounded height to
      // scroll within; without this the card keeps its full natural
      // height and the overflow is simply clipped.
      style={{ ...SHADOW.card, flexShrink: 1, maxHeight: '100%' }}
    >
      {children}
    </YStack>
  )
}

type HeaderProps = {
  accent: PhaseAccentKind
  // Small uppercase badge that names the phase / category ("PREVIEW",
  // "ARRIVED · 3 OF 10", "BUNDLE · 5 STOPS"). Callers own the copy so
  // localization stays in each panel.
  badge: string
  // The main title. Bigger, wraps to two lines max.
  title: string
  // Optional LEFT-hand accessory (e.g. tiny image thumbnail on Arrived, or
  // a nav-icon circle on Navigating). Rendered before the badge/title.
  accessory?: React.ReactNode
}

// Standard header block: colored badge + title + optional trailing thumb.
// The badge tint is the strongest phase signal — kept small so the rest of
// the card doesn't feel loud.
export function PhaseCardHeader({
  accent,
  badge,
  title,
  accessory,
}: HeaderProps) {
  const { c } = useAppTheme()
  return (
    <XStack items="center" gap="$3">
      {accessory}
      <YStack flex={1} gap="$1.5" style={{ minWidth: 0 }}>
        <XStack>
          <XStack
            px="$2"
            py="$1"
            rounded="$10"
            style={{ backgroundColor: PHASE_ACCENT[accent] }}
          >
            <SizableText
              size="$1"
              fontFamily="$body"
              fontWeight="800"
              style={{
                color: PHASE_ON_ACCENT[accent],
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {badge}
            </SizableText>
          </XStack>
        </XStack>
        <SizableText
          size="$5"
          fontFamily="$heading"
          fontWeight="700"
          color={c.text as any}
          numberOfLines={2}
        >
          {title}
        </SizableText>
      </YStack>
    </XStack>
  )
}

type ActionsProps = {
  // Primary action — always present. Renders as the full-width filled
  // button. Icon slot is optional.
  primary: {
    label: string
    onPress: () => void
    icon?: React.ReactNode
    disabled?: boolean
  }
  // Optional secondary action rendered above the primary as a text-link
  // button. Kept subtle so the primary reads as the obvious next step.
  secondary?: {
    label: string
    onPress: () => void
  }
  // Optional tertiary destructive action (e.g. "Skip all sub-stops"),
  // rendered below the primary. Muted red so it doesn't compete with
  // the primary.
  tertiary?: {
    label: string
    onPress: () => void
  }
}

// Actions slot. Layout is fixed: [secondary link] · [primary button] ·
// [tertiary link]. Every phase gets the same shape — no more per-panel
// button assemblies.
export function PhaseCardActions({
  primary,
  secondary,
  tertiary,
}: ActionsProps) {
  const { c } = useAppTheme()
  // Secondary sits BESIDE the primary rather than stacked above it. On a
  // height-capped card every row the actions take is a row the scrollable
  // body loses, and the secondary is always a short text link ("Skip",
  // "More info") that doesn't need its own full-width row.
  const renderPrimary = (inRow: boolean) => (
    <Pressable
      onPress={primary.onPress}
      disabled={primary.disabled}
      hitSlop={4}
      style={inRow ? { flex: 1 } : undefined}
    >
      <XStack
        bg={c.primary as any}
        px="$4"
        py="$3"
        rounded="$5"
        items="center"
        justify="center"
        gap="$2"
        opacity={primary.disabled ? 0.5 : 1}
      >
        {primary.icon}
        <SizableText
          color={c.onBrand as any}
          fontFamily="$heading"
          fontWeight="700"
          size="$4"
        >
          {primary.label}
        </SizableText>
      </XStack>
    </Pressable>
  )
  return (
    <YStack gap="$2">
      {secondary ? (
        <XStack items="stretch" gap="$3">
          <Pressable onPress={secondary.onPress} hitSlop={6} style={{ flex: 1 }}>
            <YStack
              items="center"
              justify="center"
              px="$4"
              py="$3"
            >
              <SizableText
                color={c.textMuted as any}
                fontFamily="$body"
                fontWeight="600"
                size="$3"
              >
                {secondary.label}
              </SizableText>
            </YStack>
          </Pressable>
          {renderPrimary(true)}
        </XStack>
      ) : (
        renderPrimary(false)
      )}
      {tertiary && (
        <Pressable onPress={tertiary.onPress} hitSlop={6}>
          <YStack items="center" py="$1.5">
            <SizableText
              fontFamily="$body"
              fontWeight="600"
              size="$3"
              style={{ color: palette.danger }}
            >
              {tertiary.label}
            </SizableText>
          </YStack>
        </Pressable>
      )}
    </YStack>
  )
}

// Body slot. Scrolls when its content is taller than the room the card
// has: ExcursionScreen caps the card at MAX_CARD_FRACTION of the screen
// and clips the overflow, so a long authored description (the Zagreb
// intro, an arrived-bundle stop) used to push PhaseCardActions out of
// view with no way to reach Skip / Continue. shrink lets this region give
// up space inside the capped card while the header and actions keep
// theirs, so the buttons stay on screen at any content length.
export function PhaseCardBody({ children }: { children: React.ReactNode }) {
  return (
    <YStack style={{ flexShrink: 1, minHeight: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Let a short body sit at its natural height rather than
        // stretching to fill the card.
        contentContainerStyle={{ flexGrow: 0 }}
        // The card lives above a map; keep the map's pan gesture from
        // stealing a scroll that starts inside the card.
        nestedScrollEnabled
      >
        <YStack gap="$2.5">{children}</YStack>
      </ScrollView>
    </YStack>
  )
}
