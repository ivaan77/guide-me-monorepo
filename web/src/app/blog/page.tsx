import type { Metadata } from 'next'
import {
  type AllPublicCitiesResponse,
  PublicPath,
  type PublicBlogListResponse,
} from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { SiteHeader } from '../_components/SiteHeader'
import { SiteFooter } from '../_components/SiteFooter'
import { BlogIndexView } from '../_components/BlogIndexView'

const PAGE_SIZE = 12

export const metadata: Metadata = {
  title: 'Stories — GuideMe',
  description:
    'City guides, travel tips, and behind-the-scenes stories from the GuideMe team.',
}

// Public blog index. ISR-cached (1h) so we don't hammer the API on
// crawler visits; publishing a new post takes at most an hour to appear.
// Query params:
//   ?page=N — pagination
//   ?city=slug — city filter, applied server-side by the API. Chip strip
//   in BlogIndexView renders when 2+ cities exist.
export const revalidate = 3600

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; city?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  // Slug shape guard: matches the API-side regex. Bad values fall back
  // to "no filter" instead of 400ing the page.
  const cityRaw = sp.city
  const city =
    cityRaw && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(cityRaw)
      ? cityRaw
      : undefined
  // Parallel: paginated blog list + full cities list (for the chip
  // strip). Cities list is small enough (< 100 KB even at scale) to
  // fetch on every page; both share the 1h ISR window.
  const [data, citiesRes] = await Promise.all([
    publicFetch<PublicBlogListResponse>(
      city
        ? `${PublicPath.Blog.list}?city=${encodeURIComponent(city)}&page=${page}&limit=${PAGE_SIZE}`
        : `${PublicPath.Blog.list}?page=${page}&limit=${PAGE_SIZE}`,
    ),
    publicFetch<AllPublicCitiesResponse>(PublicPath.Discover.cities),
  ])
  const cities = citiesRes?.cities ?? []
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <BlogIndexView
        data={data}
        cities={cities}
        activeCity={city}
        page={page}
        basePath="/blog"
        title="Stories"
        subtitle="City guides, travel tips, and notes from the road."
      />
      <SiteFooter />
    </main>
  )
}
