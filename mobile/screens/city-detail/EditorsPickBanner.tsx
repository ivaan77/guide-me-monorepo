import { Star } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type { PublicEditorPick } from '@guide-me-app/core'
import { palette } from '../../constants/Colors'
import { SHADOW } from '../../constants/Sizes'

// Navy renders well as on-amber text; not a Tamagui-registered color token,
// so we pull it directly from the palette to avoid the validator warning.
const ON_AMBER = palette.navy

type Props = {
  pick: PublicEditorPick
}

export function EditorsPickBanner({ pick }: Props) {
  return (
    <XStack
      items="center"
      gap="$3"
      px="$4"
      py="$3.5"
      rounded="$6"
      bg="$accent"
      // Soft amber-tinted shadow lifts the card off the hero image without a
      // hard ring. Elevation kept low on Android to avoid a clipped halo.
      style={SHADOW.amberCard}
    >
      <YStack
        width={44}
        height={44}
        rounded={22}
        items="center"
        justify="center"
        style={{ backgroundColor: 'rgba(11,31,58,0.12)' }}
      >
        <Star size={20} color={ON_AMBER as any} fill={ON_AMBER as any} />
      </YStack>
      <YStack flex={1} gap="$0.5">
        <SizableText
          size="$2"
          fontFamily="$body"
          fontWeight="700"
          numberOfLines={1}
          style={{
            color: ON_AMBER,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {pick.headline}
        </SizableText>
        <SizableText
          size="$3"
          fontFamily="$body"
          lineHeight="$2"
          numberOfLines={2}
          style={{ color: ON_AMBER }}
        >
          {pick.tagline}
        </SizableText>
      </YStack>
    </XStack>
  )
}
