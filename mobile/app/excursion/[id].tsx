import { useLocalSearchParams } from 'expo-router'
import { ExcursionScreen } from '../../screens/excursion'

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ExcursionScreen id={id} />
}
