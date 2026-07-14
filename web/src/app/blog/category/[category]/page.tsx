import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  type AllPublicCitiesResponse,
  BLOG_CATEGORIES,
  type BlogCategory,
  PublicPath,
  type PublicBlogListResponse,
} from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { SiteHeader } from '@/app/_components/SiteHeader'
import { SiteFooter } from '@/app/_components/SiteFooter'
import { BlogIndexView } from '@/app/_components/BlogIndexView'

const PAGE_SIZE = 12

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

const CATEGORY_DESCRIPTION: Record<BlogCategory, string> = {
  'travel-tips':
    'Practical tips for planning trips and getting more out of every day on the road.',
  'city-guide':
    "Hand-picked, walkable stories about the cities we've mapped.",
  'food-drink':
    'Places worth queuing for — from long lunches to late-night bars.',
  news: "What's new at GuideMe: features, cities, and behind-the-scenes.",
}

export const revalidate = 3600

// Static params so all 4 category pages prerender at build time. Any new
// category added to BLOG_CATEGORIES gets its route for free.
export function generateStaticParams(): { category: BlogCategory }[] {
  return BLOG_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (!(BLOG_CATEGORIES as readonly string[]).includes(category)) {
    return { title: 'Stories — GuideMe' }
  }
  const cat = category as BlogCategory
  return {
    title: `${CATEGORY_LABEL[cat]} — GuideMe`,
    description: CATEGORY_DESCRIPTION[cat],
  }
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string; city?: string }>
}) {
  const { category } = await params
  if (!(BLOG_CATEGORIES as readonly string[]).includes(category)) notFound()
  const cat = category as BlogCategory
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const cityRaw = sp.city
  const city =
    cityRaw && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(cityRaw)
      ? cityRaw
      : undefined
  const [data, citiesRes] = await Promise.all([
    publicFetch<PublicBlogListResponse>(
      city
        ? `${PublicPath.Blog.list}?category=${cat}&city=${encodeURIComponent(city)}&page=${page}&limit=${PAGE_SIZE}`
        : `${PublicPath.Blog.list}?category=${cat}&page=${page}&limit=${PAGE_SIZE}`,
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
        activeCategory={cat}
        activeCity={city}
        page={page}
        basePath={`/blog/category/${cat}`}
        title={CATEGORY_LABEL[cat]}
        subtitle={CATEGORY_DESCRIPTION[cat]}
      />
      <SiteFooter />
    </main>
  )
}
