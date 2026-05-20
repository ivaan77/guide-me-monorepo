import {
  type PublicCityDetailResponse,
  PublicPath,
} from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import { useAppLanguage } from '../providers/LanguageContext'
import { apiGet } from '../lib/api'

export function useCity(id: string | undefined) {
  const { resolved: locale } = useAppLanguage()
  return useQuery({
    queryKey: ['city', id, locale],
    enabled: !!id,
    queryFn: ({ signal }) =>
      apiGet<PublicCityDetailResponse>(PublicPath.Discover.getCityById(id!), {
        locale,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.city,
  })
}
