import { useQuery } from '@tanstack/react-query'
import { fetchCities } from '../data/cities'

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
    staleTime: 5 * 60 * 1000,
  })
}
