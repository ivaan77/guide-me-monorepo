import Link from 'next/link'
import type {
  BlogCategory,
  PublicBlogListResponse,
  PublicCity,
} from '@guide-me-app/core'
import { BlogCard } from './BlogCard'
import { BlogCategoryChips } from './BlogCategoryChips'
import { BlogCityChips } from './BlogCityChips'

const PAGE_SIZE = 12

type Props = {
  data: PublicBlogListResponse | null
  activeCategory?: BlogCategory
  activeCity?: string
  // All published cities. When length >= 2 we render the city chip row.
  // Passed in from the caller so both /blog and /blog/category share the
  // same fetch (and its ISR cache).
  cities: PublicCity[]
  page: number
  // Base path for pagination links. On /blog it's '/blog', on category
  // pages it's '/blog/category/[c]'. We append '?page=N' when needed.
  basePath: string
  title: string
  subtitle?: string
}

export function BlogIndexView({
  data,
  activeCategory,
  activeCity,
  cities,
  page,
  basePath,
  title,
  subtitle,
}: Props) {
  const posts = data?.posts ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Params to preserve when switching city (city changes reset page to
  // 1, city preserves category via the URL path structure).
  const cityChipExtras: Record<string, string> = {}

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16">
      <div className="mb-10">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
          className="text-4xl font-extrabold text-[var(--color-ink)] sm:text-5xl"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-lg text-[var(--color-ink-3)]">{subtitle}</p>
        )}
      </div>
      <BlogCategoryChips active={activeCategory} />
      <BlogCityChips
        cities={cities}
        activeCity={activeCity}
        basePath={basePath}
        extraParams={cityChipExtras}
      />
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-ink-3)]">
          {data === null
            ? 'Stories are loading elsewhere. Check back soon.'
            : 'Nothing published in this category yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={basePath}
          activeCity={activeCity}
        />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  basePath,
  activeCity,
}: {
  page: number
  totalPages: number
  basePath: string
  activeCity?: string
}) {
  const hasPrev = page > 1
  const hasNext = page < totalPages
  // Preserve the city query param across pagination so navigating page 2
  // doesn't reset the filter.
  const buildHref = (p: number): string => {
    const params = new URLSearchParams()
    if (activeCity) params.set('city', activeCity)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const prevHref = buildHref(page - 1)
  const nextHref = buildHref(page + 1)
  return (
    <div className="mt-10 flex items-center justify-between text-sm">
      <span className="text-[var(--color-ink-3)]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {hasPrev && (
          <Link
            href={prevHref}
            className="rounded-full bg-[var(--color-muted)] px-4 py-1.5 font-semibold text-[var(--color-ink-2)] hover:bg-[var(--color-border)]"
          >
            ← Previous
          </Link>
        )}
        {hasNext && (
          <Link
            href={nextHref}
            className="rounded-full bg-[var(--color-muted)] px-4 py-1.5 font-semibold text-[var(--color-ink-2)] hover:bg-[var(--color-border)]"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  )
}
