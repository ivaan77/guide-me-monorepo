import Link from 'next/link'
import type { PoiCategory } from '@guide-me-app/core'
import {
  getPopularGalleryAction,
  getUsageStatsAction,
} from '@/actions/analytics'
import { getStatsAction } from '@/actions/stats'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/forms/page-header'
import { AssetsLineChart } from '@/components/stats/assets-line-chart'
import { CumulativeLineChart } from '@/components/stats/cumulative-line-chart'
import {
  Building2,
  CheckCircle2,
  Compass,
  Flame,
  Globe,
  Headphones,
  Map as MapIcon,
  PinOff,
  Sparkles,
  Star,
  Store,
  Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<PoiCategory, string> = {
  restaurant: 'Restaurants',
  cafe: 'Cafés',
  pastry: 'Pastry shops',
  brunch: 'Brunch',
  bar: 'Bars',
  shopping: 'Shopping',
  event: 'Events',
  park: 'Parks',
  museum: 'Museums',
  viewpoint: 'Viewpoints',
  local: 'Local picks',
  workshop: 'Workshops',
  playarea: 'Play areas',
}

const CATEGORY_ORDER: PoiCategory[] = [
  'restaurant',
  'cafe',
  'pastry',
  'brunch',
  'bar',
  'shopping',
  'event',
  'park',
  'museum',
  'viewpoint',
  'local',
  'workshop',
  'playarea',
]

export default async function StatsPage() {
  // Parallel fetches. Analytics endpoints call PostHog + Mongo — if
  // PostHog is unreachable we still want the content-produced stats to
  // render, so we swallow errors on the usage/popular fetches and treat
  // them as "no data" rather than propagating to the whole page.
  const [stats, usageStats, popularItems] = await Promise.all([
    getStatsAction(),
    getUsageStatsAction().catch(() => null),
    getPopularGalleryAction().catch(() => []),
  ])
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

        {/* Assets chart — images + audio hours on separate y-axes */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              <p className="text-sm font-medium">Assets over time</p>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Cumulative image count and total narration hours. Both attributed
              to the day each parent doc was created — image adds via later
              edits are not re-dated. Two y-axes so the lines stay readable at
              any relative magnitude.
            </p>
            <AssetsLineChart data={stats.timeseries} />
          </CardContent>
        </Card>

        {/* Community engagement (analytics) — usage counters sourced from
            PostHog + the ratings collection. Same endpoints the marketing
            web consumes, cached 1h server-side. Renders "not available" if
            the analytics fetch failed (typically PostHog env vars missing
            in this environment). */}
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <p className="text-sm font-medium">Community engagement</p>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              What real usage looks like. Numbers include ratings from Mongo
              (authoritative, day-one) and PostHog events (users, hours
              listened, routes completed, countries). Values cache 1h on
              the API; the marketing landing shows the same figures.
            </p>
            {usageStats == null ? (
              <p className="text-xs text-[var(--color-muted-foreground)] italic">
                Analytics endpoint unreachable. Check API is running and
                POSTHOG_* env vars are set.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatTile
                  icon={<Users className="h-4 w-4" />}
                  label="Explorers"
                  value={usageStats.users}
                />
                <StatTile
                  icon={<Headphones className="h-4 w-4" />}
                  label="Hours listened"
                  value={usageStats.audioListenedHours}
                />
                <StatTile
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Routes completed"
                  value={usageStats.routesCompleted}
                />
                <StatTile
                  icon={<Globe className="h-4 w-4" />}
                  label="Countries"
                  value={usageStats.countriesReached}
                />
                <StatTile
                  icon={<Star className="h-4 w-4" />}
                  label="Avg rating"
                  value={usageStats.averageRating}
                  sub={`${usageStats.ratingsCount} ratings`}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular right now — data-driven view of what the public gallery
            surfaces. Lets admin spot which entities are actually being
            engaged with, complementing the editorial curator at
            /web-content. Empty when analytics is unavailable or before
            events have accumulated. */}
        {popularItems.length > 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <p className="text-sm font-medium">Popular right now</p>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Ranked by usage events — walkers for excursions, explorers
                for cities, saves for places. Hydrated back to live docs;
                disabled/deleted entities silently drop out.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {popularItems.map((item) => (
                  <PopularItemTile key={`${item.sourceType}:${item.id}`} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

function PopularItemTile({
  item,
}: {
  item: {
    id: string
    sourceType: 'city' | 'excursion' | 'place'
    title: string
    subtitle?: string
    image: string
    popularity: number
    popularityKind: 'walkers' | 'explorers' | 'saves'
  }
}) {
  // Deep-link to the entity's admin edit page. Excursions/places/cities
  // all share the same /discover/<type>s/<slug> route shape.
  const routeSegment =
    item.sourceType === 'city'
      ? 'cities'
      : item.sourceType === 'excursion'
        ? 'excursions'
        : 'places'
  const href = `/discover/${routeSegment}/${item.id}`
  const badge =
    item.sourceType === 'city'
      ? 'City'
      : item.sourceType === 'excursion'
        ? 'Tour'
        : 'Place'
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border border-[var(--color-border)] p-2 hover:bg-[var(--color-accent)] transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt=""
        className="h-12 w-16 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {badge}
        </p>
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-[var(--color-primary)] font-semibold tabular-nums">
          {item.popularity} {item.popularityKind}
        </p>
      </div>
    </Link>
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
