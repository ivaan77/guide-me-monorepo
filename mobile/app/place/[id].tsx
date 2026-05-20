import { useLocalSearchParams } from 'expo-router'
import { PlaceDetailScreen } from '../../screens/place'

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PlaceDetailScreen id={id} />
}
