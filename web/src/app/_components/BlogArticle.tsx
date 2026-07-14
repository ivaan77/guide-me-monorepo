import type { PublicBlogDetail } from '@guide-me-app/core'
import { ScrollToTop } from './ScrollToTop'
import { TipTapRenderer } from './TipTapRenderer'

const CATEGORY_LABEL: Record<PublicBlogDetail['category'], string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

// Shared blog-post article component used by both /blog/preview/[slug]
// (session 2 of the blog feature adds /blog/[slug] which will reuse this).
// Renders cover, meta strip, title, excerpt, and the TipTap body.
export function BlogArticle({ post }: { post: PublicBlogDetail }) {
  const dateFmt = new Date(post.publishedAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return (
    <article className="mx-auto max-w-3xl px-6 sm:px-10 py-12 sm:py-16 text-[var(--color-ink-2)] leading-relaxed">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.coverImage}
        alt=""
        className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover"
      />
      <div className="mb-4 flex items-center gap-3 text-sm text-[var(--color-ink-3)]">
        <span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-2)]">
          {CATEGORY_LABEL[post.category]}
        </span>
        <span>{dateFmt}</span>
        {post.readingMinutes && (
          <>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </>
        )}
      </div>
      <h1
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        className="mb-4 text-4xl font-extrabold text-[var(--color-ink)] sm:text-5xl"
      >
        {post.title}
      </h1>
      <p className="mb-10 text-lg text-[var(--color-ink-3)]">{post.excerpt}</p>
      <div className="space-y-4 [&_p]:mb-3 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[var(--color-ink)] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[var(--color-ink)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ul>li]:mb-1 [&_ol>li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-border)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_a]:text-[var(--color-bright)] [&_a:hover]:underline [&_strong]:text-[var(--color-ink)] [&_img]:my-6 [&_img]:rounded-xl [&_img]:w-full">
        <TipTapRenderer doc={post.body} />
      </div>
      <ScrollToTop />
    </article>
  )
}
