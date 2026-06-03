import Link from 'next/link'
import type { PoiCategory } from '@guide-me-app/core'
import { getStatsAction } from '@/actions/stats'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/forms/page-header'
import { CumulativeLineChart } from '@/components/stats/cumulative-line-chart'
import {
  Building2,
  Compass,
  Map as MapIcon,
  PinOff,
  Sparkles,
  Store,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<PoiCategory, string> = {
  restaurant: 'Restaurants',
  cafe: 'Cafés',
  bar: 'Bars',
  shopping: 'Shopping',
  event: 'Events',
  park: 'Parks',
}

const CATEGORY_ORDER: PoiCategory[] = [
  'restaurant',
  'cafe',
  'bar',
  'shopping',
  'event',
  'park',
]

export default async function StatsPage() {
  const stats = await getStatsAction()
  return (
    <>
      <PageHeader
        title="Stats"
        description="Content totals and cumulative growth. Numbers reflect the database — disabled rows are still counted."
      />

      <div className="flex flex-col gap-6">
        {/* Top-level counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={<Building2 className="h-4 w-4" />}
            label="Cities"
            value={stats.counts.cities}
          />
          <StatTile
            icon={<Compass className="h-4 w-4" />}
            label="Excursions"
            value={stats.counts.excursions}
            sub={`${stats.counts.excursionStops} stops`}
          />
          <StatTile
            icon={<Store className="h-4 w-4" />}
            label="Places"
            value={stats.counts.places}
          />
          <StatTile
            icon={<Sparkles className="h-4 w-4" />}
            label="Interesting facts"
            value={stats.counts.interestingFacts}
            sub={`${stats.counts.poiReferences} POI refs`}
          />
        </div>

        {/* Per-category breakdown */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3">
            <p className="text-sm font-medium">Places by category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CATEGORY_ORDER.map((cat) => (
                <div
                  key={cat}
                  className="rounded-md border border-[var(--color-border)] p-3 flex flex-col gap-1"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    {CATEGORY_LABEL[cat]}
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {stats.counts.placesByCategory[cat] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Growth chart */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              <p className="text-sm font-medium">Cumulative growth</p>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Running totals on dates when at least one entity was created. Long
              gaps without authoring activity are compressed — points are
              equispaced rather than calendar-spaced.
            </p>
            <CumulativeLineChart data={stats.timeseries} />
          </CardContent>
        </Card>

        {/* Inactive lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <InactiveList
            title="Inactive cities"
            entries={stats.inactive.cities.map((c) => ({
              slug: c.slug,
              name: c.name,
              href: `/discover/cities/${c.slug}`,
            }))}
          />
          <InactiveList
            title="Inactive excursions"
            entries={stats.inactive.excursions.map((e) => ({
              slug: e.slug,
              name: e.name,
              sub: e.citySlug,
              href: `/discover/excursions/${e.slug}`,
            }))}
          />
          <InactiveList
            title="Inactive places"
            entries={stats.inactive.places.map((p) => ({
              slug: p.slug,
              name: p.name,
              sub: p.citySlug,
              href: `/discover/places/${p.slug}`,
            }))}
          />
        </div>
      </div>
    </>
  )
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
          {icon}
          <p className="text-xs uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {sub && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}

function InactiveList({
  title,
  entries,
}: {
  title: string
  entries: { slug: string; name: string; sub?: string; href: string }[]
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <PinOff className="h-4 w-4" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        {entries.length === 0 && (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Nothing inactive.
          </p>
        )}
        {entries.map((e) => (
          <Link
            key={e.slug}
            href={e.href}
            className="flex flex-col rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-accent)] transition-colors"
          >
            <span className="truncate">{e.name}</span>
            <span className="text-[10px] font-mono text-[var(--color-muted-foreground)]">
              {e.slug}
              {e.sub ? ` · ${e.sub}` : ''}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
