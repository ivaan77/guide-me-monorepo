'use client'

import { useMemo } from 'react'
import type { AdminStatsTimeseriesPoint } from '@guide-me-app/core'

type Series = {
  key: keyof Omit<AdminStatsTimeseriesPoint, 'date'>
  label: string
  color: string
}

const SERIES: Series[] = [
  { key: 'cities', label: 'Cities', color: '#2A5BD7' },
  { key: 'excursions', label: 'Excursions', color: '#EA580C' },
  { key: 'places', label: 'Places', color: '#16A34A' },
]

type Props = {
  data: AdminStatsTimeseriesPoint[]
}

const PADDING = { top: 20, right: 16, bottom: 28, left: 36 }
const WIDTH = 720
const HEIGHT = 240

// Minimal SVG line chart. Three lines (cities/excursions/places) plotted on
// the same y-axis (max across all series) and equispaced x-axis (we treat
// each point as a discrete event, not a calendar position — so a long
// inactive stretch doesn't waste horizontal space).
export function CumulativeLineChart({ data }: Props) {
  const inner = useMemo(() => {
    if (data.length === 0) return null

    const maxY = Math.max(
      ...data.map((d) => Math.max(d.cities, d.excursions, d.places)),
    )
    // Round up max so the top gridline is a nice number.
    const yMax = Math.max(maxY, 1)
    const plotW = WIDTH - PADDING.left - PADDING.right
    const plotH = HEIGHT - PADDING.top - PADDING.bottom
    const stepX =
      data.length === 1 ? 0 : plotW / (data.length - 1)

    const xFor = (i: number): number => PADDING.left + i * stepX
    const yFor = (v: number): number =>
      PADDING.top + plotH - (v / yMax) * plotH

    const ticks = niceTicks(yMax)

    return { plotW, plotH, xFor, yFor, ticks, yMax }
  }, [data])

  if (!inner || data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
        Not enough history yet — create a city or two and come back.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Cumulative growth over time"
      >
        {/* y-axis gridlines + labels */}
        {inner.ticks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={inner.yFor(t)}
              y2={inner.yFor(t)}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
            />
            <text
              x={PADDING.left - 6}
              y={inner.yFor(t) + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-muted-foreground)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* x-axis dates: only first + last for readability */}
        {data.length > 0 && (
          <>
            <text
              x={inner.xFor(0)}
              y={HEIGHT - 8}
              textAnchor="start"
              fontSize={10}
              fill="var(--color-muted-foreground)"
            >
              {data[0].date}
            </text>
            <text
              x={inner.xFor(data.length - 1)}
              y={HEIGHT - 8}
              textAnchor="end"
              fontSize={10}
              fill="var(--color-muted-foreground)"
            >
              {data[data.length - 1].date}
            </text>
          </>
        )}

        {/* the three series */}
        {SERIES.map((s) => {
          const path = data
            .map(
              (d, i) =>
                `${i === 0 ? 'M' : 'L'} ${inner.xFor(i)} ${inner.yFor(d[s.key])}`,
            )
            .join(' ')
          return (
            <g key={s.key}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
              {data.map((d, i) => (
                <circle
                  key={`${s.key}-${i}`}
                  cx={inner.xFor(i)}
                  cy={inner.yFor(d[s.key])}
                  r={2.5}
                  fill={s.color}
                >
                  <title>{`${d.date} — ${s.label}: ${d[s.key]}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-4 text-xs">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pick a small set of round y-axis ticks ending at >= yMax.
function niceTicks(yMax: number): number[] {
  if (yMax <= 0) return [0]
  const target = 4
  const rough = yMax / target
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  let step: number
  if (norm < 1.5) step = 1 * mag
  else if (norm < 3) step = 2 * mag
  else if (norm < 7) step = 5 * mag
  else step = 10 * mag
  const ticks: number[] = []
  for (let v = 0; v <= yMax + step / 2; v += step) ticks.push(Math.round(v))
  return ticks
}
