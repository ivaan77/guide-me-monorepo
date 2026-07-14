import { useLocalSearchParams } from 'expo-router'
import { StoryDetailScreen } from '../../screens/story-detail'

export default function Route() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <StoryDetailScreen slug={slug} />
}
