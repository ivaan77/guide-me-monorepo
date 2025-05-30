import { Text, View } from 'tamagui'
import { AllCityResponse, PublicPath } from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config/env'

export default function TabTwoScreen() {
    const { data, isLoading, error } = useQuery({
      queryKey: ['cities'],
      queryFn: () => axios.get(`${API_URL}${PublicPath.City.getAll}`)
      .then(res => res.data as AllCityResponse)
    })

    if (isLoading) return <Text>Loading...</Text>
    if (error) return <Text>Error: {error.message}</Text>

  return (
    <View flex={1} items="center" justify="center" bg="$background">
      <Text fontSize={20} color="$blue10">
        Tab jddjjd
        {data?.cities.map(city => <Text key={city.id}>{city.name}</Text>)}
      </Text>
    </View>
  )
}
