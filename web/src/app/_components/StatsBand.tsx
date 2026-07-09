import type { PublicStatsResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'

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
    { label: pl(stats.cities, 'City', 'Cities'), value: fmt(stats.cities) },
    {
      label: pl(stats.excursions, 'Excursion', 'Excursions'),
      value: fmt(stats.excursions),
    },
    { label: pl(stats.places, 'Place', 'Places'), value: fmt(stats.places) },
    {
      label: pl(hours, 'Hour of audio', 'Hours of audio'),
      value: fmt(hours),
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

// Compact number formatting — matches the marketing convention of "1.2k"
// once we cross the thousand mark. Under 1000 we show the raw number so
// early days don't look padded ("48 places" reads honest; "0.0k" is silly).
function fmt(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

// English pluralization only — the marketing web is not localized. Once
// the raw count crosses 1000 (or we render "1.2k" etc) we always use the
// plural form. "1.0 Excursions" is more natural than "1.0 Excursion".
function pl(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}
