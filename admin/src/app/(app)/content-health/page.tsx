import Link from 'next/link'
import type {
  AdminAudioSlot,
  ContentHealthSeverity,
} from '@guide-me-app/core'
import { getContentHealthAction } from '@/actions/content-health'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/forms/page-header'
import {
  AlertTriangle,
  CheckCircle2,
  Headphones,
  Image as ImageIcon,
  Languages,
  Terminal,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const SEVERITY_ORDER: ContentHealthSeverity[] = [
  'critical',
  'high',
  'medium',
  'ok',
]

const SEVERITY_META: Record<
  ContentHealthSeverity,
  { label: string; blurb: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: 'Silent',
    blurb: 'No audio in any language',
    dot: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
  },
  high: {
    label: 'No English',
    blurb: 'Has audio, but not in the fallback language',
    dot: 'bg-orange-500',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  medium: {
    label: 'Partly translated',
    blurb: 'English present, German and/or Croatian missing',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  ok: {
    label: 'Complete',
    blurb: 'All three languages present',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
}

const LANG_LABEL: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  hr: 'HR',
}

export default async function ContentHealthPage() {
  const health = await getContentHealthAction()
  const { total, bySeverity, slots } = health.audio

  // Group by excursion, preserving the order the API returned (route order,
  // then slot order within each route).
  const byExcursion = new Map<string, AdminAudioSlot[]>()
  for (const slot of slots) {
    const list = byExcursion.get(slot.excursionSlug)
    if (list) list.push(slot)
    else byExcursion.set(slot.excursionSlug, [slot])
  }

  // Worst-first: routes with the most silent slots rise to the top, since
  // those are the ones worth a recording session.
  const routes = [...byExcursion.entries()]
    .map(([slug, rows]) => ({
      slug,
      name: rows[0]?.excursionName ?? slug,
      rows,
      silent: rows.filter((r) => r.severity === 'critical').length,
      complete: rows.filter((r) => r.severity === 'ok').length,
    }))
    .sort((a, b) => b.silent - a.silent || a.name.localeCompare(b.name))

  const narrated = total - bySeverity.critical

  return (
    <>
      <PageHeader
        title="Content health"
        description="Audio coverage across every narrated slot. Updated live from the database."
      />

      <div className="flex flex-col gap-6 max-w-4xl">
        <section className="grid grid-cols-4 gap-3">
          {SEVERITY_ORDER.map((sev) => {
            const meta = SEVERITY_META[sev]
            return (
              <Card key={sev}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      {meta.label}
                    </span>
                  </div>
                  <p className={`text-2xl font-semibold ${meta.text}`}>
                    {bySeverity[sev]}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1 leading-snug">
                    {meta.blurb}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="h-4 w-4" />
              <h2 className="text-sm font-semibold">
                Narration coverage
              </h2>
              <span className="text-xs text-[var(--color-muted-foreground)] ml-auto">
                {narrated} of {total} slots have some audio
              </span>
            </div>
            <CoverageBar bySeverity={bySeverity} total={total} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {routes.map((route) => (
            <Card key={route.slug}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Link
                    href={`/discover/excursions/${route.slug}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {route.name}
                  </Link>
                  <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
                    {route.silent > 0 ? (
                      <span className="text-red-600 font-medium">
                        {route.silent} silent
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        all narrated
                      </span>
                    )}
                    {' · '}
                    {route.complete}/{route.rows.length} complete
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {route.rows.map((row) => (
                    <SlotChip key={`${route.slug}:${row.slot}`} row={row} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Image audit</h2>
            </div>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              Images are graded on real pixel dimensions and file size, which
              means downloading every file (~50&nbsp;MB). That is too slow for a
              page load, so it runs as a script from the repo instead.
            </p>
            <pre className="bg-[var(--color-accent)] rounded-md p-3 text-xs overflow-x-auto">
              <code>python3 .content-audit/audit.py --compare</code>
            </pre>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              It grades all images <em>and</em> audio, writes a dated snapshot,
              and prints a per-severity diff against the{' '}
              <strong>2026-11-20 baseline</strong> so you can see what changed.
              Needs <code>ADMIN_TOKEN</code> in <code>api/.env</code> and
              Pillow. Image bytes are cached after the first run.
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] flex items-start gap-1.5">
              <Terminal className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                The audio grading above uses the same severity model as the
                script, so the two reports line up slot for slot.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Proportional stacked bar. Zero-count segments are skipped so a 0% slice
// never renders as a hairline.
function CoverageBar({
  bySeverity,
  total,
}: {
  bySeverity: Record<ContentHealthSeverity, number>
  total: number
}) {
  if (total === 0) return null
  return (
    <>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--color-accent)]">
        {SEVERITY_ORDER.map((sev) =>
          bySeverity[sev] > 0 ? (
            <div
              key={sev}
              className={SEVERITY_META[sev].dot}
              style={{ width: `${(bySeverity[sev] / total) * 100}%` }}
              title={`${SEVERITY_META[sev].label}: ${bySeverity[sev]}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {SEVERITY_ORDER.map((sev) => (
          <span
            key={sev}
            className="text-xs text-[var(--color-muted-foreground)] inline-flex items-center gap-1.5"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${SEVERITY_META[sev].dot}`}
            />
            {SEVERITY_META[sev].label} {bySeverity[sev]}
          </span>
        ))}
      </div>
    </>
  )
}

function SlotChip({ row }: { row: AdminAudioSlot }) {
  const meta = SEVERITY_META[row.severity]
  const langs =
    row.languages.length > 0
      ? row.languages.map((l) => LANG_LABEL[l] ?? l).join(' ')
      : 'none'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${meta.bg} ${meta.text}`}
      title={`${row.slot} — ${meta.blurb} (${langs})`}
    >
      {row.severity === 'critical' ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Languages className="h-3 w-3" />
      )}
      <span className="font-medium">{row.slot}</span>
      <span className="opacity-70">{langs}</span>
    </span>
  )
}
