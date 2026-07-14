import Link from 'next/link'
import type { PublicCity } from '@guide-me-app/core'

// Second chip row for /blog + /blog/category: filters posts by city.
// Filter state lives in the URL query string (?city=slug), so every
// filter view is shareable and crawlable.
//
// Only renders when there are 2+ cities. A single-city launch doesn't
// need the affordance — mirrors the same gate the mobile Stories tab
// uses so the two surfaces behave consistently.
export function BlogCityChips({
  cities,
  activeCity,
  basePath,
  extraParams,
}: {
  cities: PublicCity[]
  // Undefined = "All cities" (no ?city param). Otherwise the currently-
  // selected city id (which is also the slug).
  activeCity?: string
  // The path to link back to when a chip is clicked. On /blog this is
  // '/blog', on /blog/category/[c] it's '/blog/category/[c]'.
  basePath: string
  // Any query params we need to preserve when switching city (e.g.
  // ?page=1 gets reset because a filter change should return to page 1).
  // Callers pass the params they want to keep; page is intentionally
  // omitted here.
  extraParams?: Record<string, string>
}) {
  if (cities.length < 2) return null

  const buildHref = (city?: string): string => {
    const params = new URLSearchParams(extraParams ?? {})
    if (city) params.set('city', city)
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <nav
      aria-label="Blog cities"
      className="mb-6 flex flex-wrap gap-2"
    >
      <Chip href={buildHref(undefined)} active={!activeCity}>
        All cities
      </Chip>
      {cities.map((c) => (
        <Chip
          key={c.id}
          href={buildHref(c.id)}
          active={activeCity === c.id}
        >
          {c.name}
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
