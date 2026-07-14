import type { MetadataRoute } from 'next'
import {
  BLOG_CATEGORIES,
  PublicPath,
  type PublicBlogListResponse,
} from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'

// Base URL for sitemap entries. Set NEXT_PUBLIC_SITE_URL in the Vercel
// project settings; the fallback matches the production domain so a
// forgotten env var still produces a valid sitemap (just with harder-
// to-change base URL).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://guidemeapp.xyz'

// Fetch every published post for sitemap generation. The list endpoint
// caps at limit=50 so we page until we've seen everything. Small blogs
// are rare to have >50 posts, but this handles growth without a rewrite.
async function fetchAllPosts(): Promise<PublicBlogListResponse['posts']> {
  const all: PublicBlogListResponse['posts'] = []
  let page = 1
  while (true) {
    const res = await publicFetch<PublicBlogListResponse>(
      `${PublicPath.Blog.list}?page=${page}&limit=50`,
    )
    if (!res || res.posts.length === 0) break
    all.push(...res.posts)
    if (all.length >= res.total) break
    page += 1
    // Safety brake — shouldn't hit this in practice, but a runaway loop
    // in the sitemap build would nuke the whole deploy.
    if (page > 100) break
  }
  return all
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchAllPosts()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/gallery`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/blog/category/${c}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...postRoutes]
}
