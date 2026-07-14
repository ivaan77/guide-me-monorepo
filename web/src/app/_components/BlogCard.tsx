import Link from 'next/link'
import type { BlogCategory, PublicBlogSummary } from '@guide-me-app/core'

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

// Blog card used on /blog index + /blog/category pages. Whole card is a
// link to /blog/[slug]. Cover image → category badge + date + reading
// time → title → excerpt. No author byline (single-author site for now).
export function BlogCard({ post }: { post: PublicBlogSummary }) {
  const dateFmt = new Date(post.publishedAt).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] transition-colors hover:border-[var(--color-primary)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.coverImage}
        alt=""
        loading="lazy"
        className="aspect-[16/9] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-3)]">
          <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 font-semibold uppercase tracking-wide text-[var(--color-ink-2)]">
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
        <h2
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
          className="text-xl font-bold leading-tight text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]"
        >
          {post.title}
        </h2>
        <p className="line-clamp-3 text-sm text-[var(--color-ink-3)]">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}
