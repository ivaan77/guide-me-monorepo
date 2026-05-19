import { Star } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type { EditorPick } from '../../data/cities'

type Props = {
  pick: EditorPick
}

export function EditorsPickBanner({ pick }: Props) {
  return (
    <XStack
      bg="$surface"
      rounded="$6"
      borderWidth={1}
      borderColor="$borderColor"
      px="$4"
      py="$3.5"
      gap="$3"
      items="center"
      shadowColor="#000"
      shadowOpacity={0.12}
      shadowRadius={16}
      shadowOffset={{ width: 0, height: 6 }}
      elevation={6}
    >
      <YStack
        width={36}
        height={36}
        rounded={18}
        bg="$primary"
        items="center"
        justify="center"
      >
        <Star size={18} color="#FFFFFF" fill="#FFFFFF" />
      </YStack>
      <YStack flex={1} gap="$1">
        <SizableText
          size="$2"
          fontFamily="$body"
          fontWeight="700"
          color="$primary"
          style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          {pick.headline}
        </SizableText>
        <SizableText
          size="$3"
          fontFamily="$body"
          color="$color"
          lineHeight="$2"
        >
          {pick.tagline}
        </SizableText>
      </YStack>
    </XStack>
  )
}
