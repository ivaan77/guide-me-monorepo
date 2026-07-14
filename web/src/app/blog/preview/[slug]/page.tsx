import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicPath, type PublicBlogDetailResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { SiteHeader } from '@/app/_components/SiteHeader'
import { SiteFooter } from '@/app/_components/SiteFooter'
import { BlogArticle } from '@/app/_components/BlogArticle'

// Draft-preview route. Anyone with (slug, token) can see the post,
// regardless of publish status. Not indexed (noindex + no sitemap entry).
// The public /blog/[slug] route (session 2 of the blog feature) will use
// the same BlogArticle component to render published posts.
//
// We revalidate 0 seconds — always fresh — because previews are usually
// consulted immediately after a save, and stale ISR would show yesterday's
// draft under the author's fingertips.

export const dynamic = 'force-dynamic'

// noindex the preview URLs so if someone shares the link it doesn't end
// up in search results. Robots meta is the belt-and-suspenders here; the
// URL is already token-gated at the API layer.
export const metadata: Metadata = {
  title: 'Preview — GuideMe',
  robots: { index: false, follow: false },
}

export default async function BlogPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams
  if (!token) notFound()
  const res = await publicFetch<PublicBlogDetailResponse>(
    PublicPath.Blog.getPreview(slug, token),
    0, // no ISR — always fetch fresh
  )
  if (!res) notFound()

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
        <div className="mx-auto max-w-3xl px-6 py-2 text-xs text-[var(--color-ink-3)]">
          Preview mode · this URL is unlisted. Anyone with the link can view.
        </div>
      </div>
      <BlogArticle post={res.post} />
      <SiteFooter />
    </main>
  )
}
