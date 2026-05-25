import Link from 'next/link'
import { listCitiesAction } from '@/actions/cities'
import { listExcursionsAction } from '@/actions/excursions'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { ExcursionsTable } from './excursions-table'
import { ExcursionsFilters } from './excursions-filters'

export const dynamic = 'force-dynamic'

export default async function ExcursionsPage({
  searchParams,
}: {
  searchParams: Promise<{ citySlug?: string }>
}) {
  const sp = await searchParams
  const citySlug = sp.citySlug || undefined
  const [excursions, cities] = await Promise.all([
    listExcursionsAction(citySlug),
    listCitiesAction(),
  ])
  return (
    <>
      <PageHeader
        title="Excursions"
        description={`${excursions.length} matching.`}
        actions={
          <Button asChild>
            <Link href="/discover/excursions/new">
              <Plus className="h-4 w-4" />
              New excursion
            </Link>
          </Button>
        }
      />
      <ExcursionsFilters
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        currentCitySlug={citySlug}
      />
      <ExcursionsTable excursions={excursions} />
    </>
  )
}
