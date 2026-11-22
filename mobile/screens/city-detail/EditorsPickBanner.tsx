import { Star } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type { PublicEditorPick } from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'
import { useAppTheme } from '../../providers/ThemeContext'
import { useLayout } from '../../hooks/useLayout'

// Navy renders well as on-amber text; not a Tamagui-registered color token,
// so we pull it directly from the palette to avoid the validator warning.
const ON_AMBER = palette.navy

type Props = {
  pick: PublicEditorPick
}

export function EditorsPickBanner({ pick }: Props) {
  const { c } = useAppTheme()
  const { isSmall } = useLayout()
  return (
    <XStack
      items="center"
      gap={isSmall ? '$2.5' : '$3'}
      px={isSmall ? '$3' : '$4'}
      py={isSmall ? '$2' : '$3.5'}
      rounded="$6"
      bg={c.accent as any}
      // Soft amber-tinted shadow lifts the card off the hero image without a
      // hard ring. Elevation kept low on Android to avoid a clipped halo.
      style={SHADOW.amberCard}
    >
      <YStack
        width={isSmall ? 30 : 44}
        height={isSmall ? 30 : 44}
        rounded={22}
        items="center"
        justify="center"
        style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
      >
        <Star size={isSmall ? 14 : 20} color={ON_AMBER as any} fill={ON_AMBER as any} />
      </YStack>
      <YStack flex={1} gap="$0.5">
        <SizableText
          fontFamily="$body"
          fontWeight="700"
          numberOfLines={1}
          style={{
            fontSize: isSmall ? 9.5 : 12,
            color: ON_AMBER,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {pick.headline}
        </SizableText>
        <SizableText
          fontFamily="$body"
          numberOfLines={2}
          style={{
            fontSize: isSmall ? 11.5 : 14,
            lineHeight: isSmall ? 15 : 18,
            color: ON_AMBER,
          }}
        >
          {pick.tagline}
        </SizableText>
      </YStack>
    </XStack>
  )
}
