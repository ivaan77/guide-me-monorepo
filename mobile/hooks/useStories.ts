import {
  type BlogCategory,
  PublicPath,
  type PublicBlogDetailResponse,
  type PublicBlogListResponse,
} from '@guide-me-app/core'
import { useQuery } from '@tanstack/react-query'
import { useAppLanguage } from '../providers/LanguageContext'
import { apiGet } from '../lib/api'

const LIST_PAGE_SIZE = 20

// Fetches the paginated list of published stories. Server orders by
// publishedAt DESC. Category + city filters optional and combine (the
// API applies both). 5-minute staleTime matches the cities hook —
// content doesn't change fast enough to warrant more.
export function useStories(opts: {
  category?: BlogCategory
  citySlug?: string
} = {}) {
  const { resolved: locale } = useAppLanguage()
  const { category, citySlug } = opts
  return useQuery({
    queryKey: ['stories', locale, category ?? 'all', citySlug ?? 'all'],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: '1',
        limit: String(LIST_PAGE_SIZE),
      })
      if (category) params.set('category', category)
      if (citySlug) params.set('city', citySlug)
      return apiGet<PublicBlogListResponse>(
        `${PublicPath.Blog.list}?${params.toString()}`,
        { locale, signal },
      )
    },
    staleTime: 5 * 60 * 1000,
    select: (response) => response.posts,
  })
}

export function useStory(slug: string | undefined) {
  const { resolved: locale } = useAppLanguage()
  return useQuery({
    queryKey: ['story', locale, slug],
    enabled: !!slug,
    queryFn: ({ signal }) =>
      apiGet<PublicBlogDetailResponse>(PublicPath.Blog.getPost(slug!), {
        locale,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    select: (response) => response.post,
  })
}
