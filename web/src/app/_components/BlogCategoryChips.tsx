import Link from 'next/link'
import { BLOG_CATEGORIES, type BlogCategory } from '@guide-me-app/core'

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

// Filter chips row. "All" links to /blog; each category chip links to
// /blog/category/[slug]. Server-rendered — no client-side filter state
// because navigation-driven filtering plays nicer with SEO (each URL is
// crawlable and shareable).
export function BlogCategoryChips({
  active,
}: {
  // Undefined = "All" (index page). Otherwise the currently-selected
  // category chip. The active chip renders with primary color; others
  // are muted.
  active?: BlogCategory
}) {
  return (
    <nav
      aria-label="Blog categories"
      className="mb-8 flex flex-wrap gap-2"
    >
      <Chip href="/blog" active={!active}>
        All
      </Chip>
      {BLOG_CATEGORIES.map((c) => (
        <Chip key={c} href={`/blog/category/${c}`} active={active === c}>
          {CATEGORY_LABEL[c]}
        </Chip>
      ))}
    </nav>
  )
}

function Chip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-muted)] text-[var(--color-ink-2)] hover:bg-[var(--color-border)]'
      }`}
    >
      {children}
    </Link>
  )
}
