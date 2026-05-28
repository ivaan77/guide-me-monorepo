import { YStack, Spinner } from 'tamagui'

export default function SSOCallback() {
  return (
    <YStack flex={1} items="center" justify="center" bg="$background">
      <Spinner size="large" />
    </YStack>
  )
}
