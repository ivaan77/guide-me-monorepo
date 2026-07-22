import { Anchor, Paragraph, View, XStack } from 'tamagui'
import { useAppTheme } from '../providers/ThemeContext'

export default function ModalScreen() {
  const { c } = useAppTheme()
  return (
    <View flex={1} items="center" justify="center">
      <XStack gap="$2">
        <Paragraph text="center">Made by</Paragraph>
        <Anchor color={c.primary as any} href="https://twitter.com/natebirdman" target="_blank">
          @natebirdman,
        </Anchor>
        <Anchor
          color={c.accent as any}
          href="https://github.com/tamagui/tamagui"
          target="_blank"
          rel="noreferrer"
        >
          ⭐️
        </Anchor>
      </XStack>
    </View>
  )
}
