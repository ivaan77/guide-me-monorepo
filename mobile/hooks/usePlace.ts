import { type PublicPlaceResponse, PublicPath } from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import { useAppLanguage } from '../providers/LanguageContext'
import { apiGet } from '../lib/api'

export function usePlace(id: string | undefined) {
  const { resolved: locale } = useAppLanguage()
  return useQuery({
    queryKey: ['place', id, locale],
    enabled: !!id,
    queryFn: ({ signal }) =>
      apiGet<PublicPlaceResponse>(PublicPath.Discover.getPlaceById(id!), {
        locale,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.place,
  })
}
