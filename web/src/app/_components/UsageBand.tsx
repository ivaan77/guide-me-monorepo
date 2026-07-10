import type { PublicUsageStatsResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { fmtCount, pluralize } from '@/lib/formatters'

// Per-metric visibility floors. Each counter appears only when its own
// number crosses the floor — a healthy metric doesn't have to wait for
// its neighbors. "0 users" reads awful; hiding just that counter while
// showing "★ 4.6 average" is honest and complete.
const MIN_USERS = 10
const MIN_HOURS = 10
const MIN_ROUTES = 10
// Countries needs a very small floor — even 5 countries is impressive
// and dropping it below that would be misleading (looks like the app is
// only used locally when GeoIP could just be sparse).
const MIN_COUNTRIES = 5
// Rating average is only shown when we have enough ratings to be
// statistically meaningful. Below this floor a single 5-star or 3-star
// review swings the number wildly.
const MIN_RATINGS = 5

// Community engagement counter band shown beneath the content-produced
// StatsBand. Each counter is independently gated (see MIN_* constants).
// The whole band renders nothing when every counter would be gated —
// keeps the landing clean pre-launch.
export async function UsageBand() {
  const res = await publicFetch<PublicUsageStatsResponse>(
    '/public/web/usage-stats',
  )
  if (!res) return null
  const { stats } = res

  const items: { label: string; value: string }[] = []

  if (stats.users >= MIN_USERS) {
    items.push({
      label: pluralize(stats.users, 'Explorer', 'Explorers'),
      value: fmtCount(stats.users),
    })
  }
  if (stats.audioListenedHours >= MIN_HOURS) {
    items.push({
      label: pluralize(
        stats.audioListenedHours,
        'Hour listened',
        'Hours listened',
      ),
      value: fmtCount(stats.audioListenedHours),
    })
  }
  if (stats.routesCompleted >= MIN_ROUTES) {
    items.push({
      label: pluralize(
        stats.routesCompleted,
        'Route completed',
        'Routes completed',
      ),
      value: fmtCount(stats.routesCompleted),
    })
  }
  if (stats.countriesReached >= MIN_COUNTRIES) {
    items.push({
      label: pluralize(stats.countriesReached, 'Country', 'Countries'),
      value: fmtCount(stats.countriesReached),
    })
  }
  if (stats.ratingsCount >= MIN_RATINGS && stats.averageRating > 0) {
    // Star glyph baked into the value so it visually clusters with the
    // number rather than sitting in the label slot with the other units.
    items.push({
      label: 'Average rating',
      value: `★ ${stats.averageRating.toFixed(1)}`,
    })
  }

  if (items.length === 0) return null

  return (
    <ul
      className="mt-3 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-3 text-[var(--color-ink-2)]"
      aria-label="Community engagement"
    >
      {items.map((it) => (
        <li key={it.label} className="flex items-baseline gap-2">
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--color-primary)]"
          >
            {it.value}
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-3)]">
            {it.label}
          </span>
        </li>
      ))}
    </ul>
  )
}
