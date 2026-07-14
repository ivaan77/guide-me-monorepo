import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicPath, type PublicBlogDetailResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { SiteHeader } from '../../_components/SiteHeader'
import { SiteFooter } from '../../_components/SiteFooter'
import { BlogArticle } from '../../_components/BlogArticle'

// ISR window matches the index page. Publishing a post takes at most an
// hour to be visible; setting revalidate to 0 would be safer but adds
// cold-fetch latency to every visitor after a cache flush.
export const revalidate = 3600

// Populate OG + description meta from the post itself. Author's
// metaTitle/metaDescription/ogImage overrides are honored; otherwise
// we fall back to the visible title/excerpt/coverImage.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const res = await publicFetch<PublicBlogDetailResponse>(
    PublicPath.Blog.getPost(slug),
  )
  if (!res) {
    // Missing post = generic metadata so a share of a broken link still
    // renders SOMETHING sane rather than "undefined" strings.
    return { title: 'Story — GuideMe' }
  }
  const { post } = res
  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt
  const image = post.ogImage ?? post.coverImage
  return {
    title: `${title} — GuideMe`,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const res = await publicFetch<PublicBlogDetailResponse>(
    PublicPath.Blog.getPost(slug),
  )
  if (!res) notFound()
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <BlogArticle post={res.post} />
      <SiteFooter />
    </main>
  )
}
