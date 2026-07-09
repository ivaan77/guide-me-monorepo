'use client'

import { useMemo } from 'react'
import type { AdminStatsTimeseriesPoint } from '@guide-me-app/core'

const PADDING = { top: 20, right: 46, bottom: 28, left: 40 }
const WIDTH = 720
const HEIGHT = 240

const IMAGES_COLOR = '#2563EB'
const AUDIO_COLOR = '#EA580C'

type Props = {
  data: AdminStatsTimeseriesPoint[]
}

// Two-series chart: cumulative image count on the left y-axis, cumulative
// audio hours on the right y-axis. Same equispaced x-axis as the growth
// chart (one point per authored day). Separate scales so the two lines
// stay readable regardless of relative magnitude — a 30-min recording
// doesn't dwarf a 200-image day, and vice versa.
export function AssetsLineChart({ data }: Props) {
  const inner = useMemo(() => {
    if (data.length === 0) return null

    const audioHours = data.map((d) => d.audioDurationMs / 3_600_000)
    const maxImg = Math.max(...data.map((d) => d.images), 1)
    const maxHours = Math.max(...audioHours, 0.25) // floor at 15min so a tiny catalog doesn't render as a flat line

    const plotW = WIDTH - PADDING.left - PADDING.right
    const plotH = HEIGHT - PADDING.top - PADDING.bottom
    const stepX = data.length === 1 ? 0 : plotW / (data.length - 1)

    const xFor = (i: number): number => PADDING.left + i * stepX
    const yForImg = (v: number): number =>
      PADDING.top + plotH - (v / maxImg) * plotH
    const yForHours = (v: number): number =>
      PADDING.top + plotH - (v / maxHours) * plotH

    return {
      plotW,
      plotH,
      xFor,
      yForImg,
      yForHours,
      imgTicks: niceTicks(maxImg),
      hoursTicks: niceTicksFloat(maxHours),
      maxImg,
      maxHours,
      audioHours,
    }
  }, [data])

  if (!inner || data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
        No history yet — add content and come back.
      </div>
    )
  }

  const imgPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${inner.xFor(i)} ${inner.yForImg(d.images)}`)
    .join(' ')
  const hoursPath = inner.audioHours
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${inner.xFor(i)} ${inner.yForHours(h)}`)
    .join(' ')

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Cumulative images and audio hours over time"
      >
        {/* left y-axis (images) gridlines + labels */}
        {inner.imgTicks.map((t) => (
          <g key={`img-${t}`}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={inner.yForImg(t)}
              y2={inner.yForImg(t)}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
            />
            <text
              x={PADDING.left - 6}
              y={inner.yForImg(t) + 4}
              textAnchor="end"
              fontSize={10}
              fill={IMAGES_COLOR}
            >
              {t}
            </text>
          </g>
        ))}

        {/* right y-axis (audio hours) labels — no gridlines to avoid clutter */}
        {inner.hoursTicks.map((t) => (
          <text
            key={`hrs-${t}`}
            x={WIDTH - PADDING.right + 6}
            y={inner.yForHours(t) + 4}
            textAnchor="start"
            fontSize={10}
            fill={AUDIO_COLOR}
          >
            {formatHours(t)}
          </text>
        ))}

        {/* x-axis first + last date */}
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

        {/* images line */}
        <path d={imgPath} fill="none" stroke={IMAGES_COLOR} strokeWidth={2} />
        {data.map((d, i) => (
          <circle
            key={`img-p-${i}`}
            cx={inner.xFor(i)}
            cy={inner.yForImg(d.images)}
            r={2.5}
            fill={IMAGES_COLOR}
          >
            <title>{`${d.date} — Images: ${d.images}`}</title>
          </circle>
        ))}

        {/* audio hours line */}
        <path d={hoursPath} fill="none" stroke={AUDIO_COLOR} strokeWidth={2} />
        {inner.audioHours.map((h, i) => (
          <circle
            key={`hrs-p-${i}`}
            cx={inner.xFor(i)}
            cy={inner.yForHours(h)}
            r={2.5}
            fill={AUDIO_COLOR}
          >
            <title>{`${data[i].date} — Audio: ${formatHours(h)}`}</title>
          </circle>
        ))}
      </svg>

      <div className="flex flex-wrap gap-4 text-xs">
        <LegendDot color={IMAGES_COLOR} label="Images (left axis)" />
        <LegendDot color={AUDIO_COLOR} label="Audio hours (right axis)" />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  )
}

// Integer ticks — same helper the growth chart uses; duplicated here rather
// than shared so the two charts can diverge without accidental coupling.
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

// Float ticks for hours (fractional values like 0.25, 0.5, 1, 2.5). Same
// nice-round-number logic but preserves decimals below 1.
function niceTicksFloat(yMax: number): number[] {
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
  for (let v = 0; v <= yMax + step / 2; v += step) ticks.push(v)
  return ticks
}

function formatHours(h: number): string {
  if (h >= 10) return `${Math.round(h)}h`
  if (h >= 1) return `${h.toFixed(1)}h`
  const mins = Math.round(h * 60)
  return `${mins}m`
}
