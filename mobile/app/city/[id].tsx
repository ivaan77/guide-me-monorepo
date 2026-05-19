import { useLocalSearchParams } from 'expo-router'
import { CityDetailScreen } from '../../screens/city-detail'

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CityDetailScreen id={id} />
}
