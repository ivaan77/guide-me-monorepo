import type { PublicStatsResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { fmtCount, pluralize } from '@/lib/formatters'

// Compact horizontal counter band beneath the hero CTAs. Renders four
// counters:
//   Cities · Excursions · Places · Hours of audio.
// Numbers come from /public/web/stats (cached 1h on the API + revalidated
// hourly here). If the API is unreachable at build time, the component
// returns null so the landing degrades gracefully to the plain hero.
export async function StatsBand() {
  const res = await publicFetch<PublicStatsResponse>('/public/web/stats')
  if (!res) return null
  const { stats } = res
  const hours = Math.round(stats.audioDurationMs / 3_600_000)

  const items: { label: string; value: string }[] = [
    {
      label: pluralize(stats.cities, 'City', 'Cities'),
      value: fmtCount(stats.cities),
    },
    {
      label: pluralize(stats.excursions, 'Excursion', 'Excursions'),
      value: fmtCount(stats.excursions),
    },
    {
      label: pluralize(stats.places, 'Place', 'Places'),
      value: fmtCount(stats.places),
    },
    {
      label: pluralize(hours, 'Hour of audio', 'Hours of audio'),
      value: fmtCount(hours),
    },
  ]

  return (
    <ul
      className="mt-8 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-3 text-[var(--color-ink-2)]"
      aria-label="Content produced"
    >
      {items.map((it) => (
        <li key={it.label} className="flex items-baseline gap-2">
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--color-ink)]"
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

