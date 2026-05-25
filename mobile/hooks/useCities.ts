import { type AllPublicCitiesResponse, PublicPath } from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import { useAppLanguage } from '../providers/LanguageContext'
import { apiGet } from '../lib/api'

export function useCities() {
  const { resolved: locale } = useAppLanguage()
  return useQuery({
    queryKey: ['cities', locale],
    queryFn: ({ signal }) =>
      apiGet<AllPublicCitiesResponse>(PublicPath.Discover.cities, {
        locale,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.cities,
  })
}
