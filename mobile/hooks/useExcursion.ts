import {
  type PublicExcursionResponse,
  PublicPath,
} from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import { useAppLanguage } from '../providers/LanguageContext'
import { apiGet } from '../lib/api'

export function useExcursion(id: string | undefined) {
  const { resolved: locale } = useAppLanguage()
  return useQuery({
    queryKey: ['excursion', id, locale],
    enabled: !!id,
    queryFn: ({ signal }) =>
      apiGet<PublicExcursionResponse>(
        PublicPath.Discover.getExcursionById(id!),
        { locale, signal },
      ),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.excursion,
  })
}
