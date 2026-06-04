import Link from 'next/link'
import type { PoiCategory } from '@guide-me-app/core'
import { listCitiesAction } from '@/actions/cities'
import { listPlacesAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { PlacesTable } from './places-table'
import { PlacesFilters } from './places-filters'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: PoiCategory[] = [
  'restaurant',
  'cafe',
  'bar',
  'shopping',
  'event',
  'park',
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

  const [places, cities] = await Promise.all([
    listPlacesAction(citySlug, category),
    listCitiesAction(),
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
      <PlacesFilters
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        currentCitySlug={citySlug}
        currentCategory={category}
      />
      <PlacesTable places={places} />
    </>
  )
}
