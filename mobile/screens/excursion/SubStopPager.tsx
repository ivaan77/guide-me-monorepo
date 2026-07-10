import { Pressable, ScrollView } from 'react-native'
import { SizableText, XStack, YStack } from 'tamagui'
import { BUNDLE_ACCENT } from './StopBundlePin'

// Inline numbered pager rendered in the body of the ArrivedPanel when the
// current stop is a bundle. Replaces the previous "linear next-only" flow
// where the user had to Next through sub-stops in order and open a sheet
// to see any of them.
//
// Visual: horizontally-scrollable row of chips. Chip 0 represents the
// bundle intro ("all N sub-stops overview"); chips 1..N represent the
// individual sub-stops. Current chip is filled with the bundle-violet;
// visited chips get a subtle outline; unvisited chips are muted.
//
// Users can freely tap any chip to jump — the parent owns the state via
// onJump, so the "current" prop always reflects truth. Free navigation
// makes physical sense here: all sub-stops are within meters of each
// other, so allowing 1→3→2 isn't misleading.

type Props = {
  // Number of real sub-stops in the bundle (not counting the intro slot).
  count: number
  // -1 = bundle intro; 0..count-1 = individual sub-stops.
  current: number
  // Sub-stop indices the user has already visited (moved past). Rendered
  // with a soft outline so users can see where they've been vs where
  // they're going. Doesn't include the current position.
  visited?: Set<number>
  // Fire with the target sub-stop index (-1 for the intro). Parent maps
  // this to the same state as the Next button.
  onJump: (nextIndex: number) => void
}

// Sub-stop chip size — matches the map bundle pin's badge diameter (20dp)
// so the two visual languages line up: the pin badge shows the total,
// each chip shows a slot in that total.
const CHIP_DIAMETER = 32
const CHIP_GAP = 6

export function SubStopPager({ count, current, visited, onJump }: Props) {
  // Build the slot indices — [-1, 0, 1, ..., count-1]. Intro sits at the
  // left as a visually-distinct chip so users don't confuse it with a
  // numbered sub-stop.
  const slots = [-1, ...Array.from({ length: count }, (_, i) => i)]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Slight vertical padding so the chip lift on the current-selected
      // chip (border) doesn't get clipped by the parent card.
      contentContainerStyle={{ paddingVertical: 2, gap: CHIP_GAP }}
    >
      {slots.map((idx) => {
        const isCurrent = idx === current
        const isVisited = visited?.has(idx) ?? false
        const isIntro = idx === -1
        return (
          <Chip
            key={idx}
            label={isIntro ? '·' : String(idx + 1)}
            isCurrent={isCurrent}
            isVisited={isVisited}
            isIntro={isIntro}
            onPress={() => onJump(idx)}
          />
        )
      })}
    </ScrollView>
  )
}

function Chip({
  label,
  isCurrent,
  isVisited,
  isIntro,
  onPress,
}: {
  label: string
  isCurrent: boolean
  isVisited: boolean
  isIntro: boolean
  onPress: () => void
}) {
  // Filled violet for current; outlined violet for visited; muted grey
  // for unvisited. Intro chip is always outlined regardless of visited
  // state so users read it as "start here" rather than "position 0".
  const bg = isCurrent
    ? BUNDLE_ACCENT
    : 'transparent'
  const borderColor = isCurrent || isVisited || isIntro
    ? BUNDLE_ACCENT
    : 'rgba(148, 163, 184, 0.4)' // neutral400ish
  const textColor = isCurrent
    ? '#FFFFFF'
    : isVisited || isIntro
      ? BUNDLE_ACCENT
      : 'rgba(107, 114, 128, 0.9)' // neutral500ish

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <YStack
        width={CHIP_DIAMETER}
        height={CHIP_DIAMETER}
        rounded={CHIP_DIAMETER / 2}
        items="center"
        justify="center"
        style={{
          backgroundColor: bg,
          borderWidth: 2,
          borderColor,
        }}
      >
        <SizableText
          size="$2"
          fontFamily="$body"
          fontWeight="800"
          style={{ color: textColor }}
        >
          {label}
        </SizableText>
      </YStack>
    </Pressable>
  )
}

// Convenience label for the current chip — callers can render this in
// their header so the user reads "Sub-stop 3 of 5" without having to
// count chips themselves.
export function subStopPagerLabel(
  current: number,
  count: number,
  t: (key: string, opts: Record<string, unknown>) => string,
): string {
  if (current < 0) {
    return t('excursion.arrived.bundleIntroShort', {
      count,
      defaultValue: `${count} stops`,
    })
  }
  return t('excursion.arrived.bundlePositionShort', {
    index: current + 1,
    total: count,
    defaultValue: `${current + 1} of ${count}`,
  })
}
