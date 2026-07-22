import { YStack, Spinner } from 'tamagui'
import { useAppTheme } from '../providers/ThemeContext'

export default function SSOCallback() {
  const { c } = useAppTheme()
  return (
    <YStack flex={1} items="center" justify="center" bg={c.background as any}>
      <Spinner size="large" />
    </YStack>
  )
}
