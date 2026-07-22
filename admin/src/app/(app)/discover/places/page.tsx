import Link from 'next/link'
import type { PoiCategory } from '@guide-me-app/core'
import { listCitiesAction } from '@/actions/cities'
import { listDraftsAction } from '@/actions/drafts'
import { listPlacesAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import {
  DraftsBanner,
  type DraftBannerRow,
} from '@/components/forms/drafts-banner'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { PlacesTable } from './places-table'
import { PlacesFilters } from './places-filters'

function labelForPlaceDraft(payload: unknown): string {
  const p = payload as { name?: { en?: string } } | null
  return p?.name?.en?.trim() || ''
}

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: PoiCategory[] = [
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
  'petFriendly',
  'kidsFriendly',
]

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ citySlug?: string; category?: string }>
}) {
  const sp = await searchParams
  const citySlug = sp.citySlug || undefined
  const category = (VALID_CATEGORIES as string[]).includes(sp.category ?? '')
    ? (sp.category as PoiCategory)
    : undefined

  const [places, cities, drafts] = await Promise.all([
    listPlacesAction(citySlug, category),
    listCitiesAction(),
    listDraftsAction('place'),
  ])

  return (
    <>
      <PageHeader
        title="Places & Events"
        description={`${places.length} matching. Restaurants, cafés, bars, shopping, events, and parks.`}
        actions={
          <Button asChild>
            <Link href="/discover/places/new">
              <Plus className="h-4 w-4" />
              New place
            </Link>
          </Button>
        }
      />
      <DraftsBanner
        entityType="place"
        rows={drafts.map<DraftBannerRow>((d) => ({
          slug: d.slug,
          isNew: d.isNew,
          updatedAt: d.updatedAt,
          label: labelForPlaceDraft(d.payload),
          href: d.isNew
            ? `/discover/places/new?draft=${encodeURIComponent(d.slug)}`
            : `/discover/places/${encodeURIComponent(d.slug)}`,
        }))}
      />
      <PlacesFilters
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        currentCitySlug={citySlug}
        currentCategory={category}
      />
      <PlacesTable places={places} />
    </>
  )
}
