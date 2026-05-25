import Link from 'next/link'
import { listCitiesAction } from '@/actions/cities'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { CitiesTable } from './cities-table'

export const dynamic = 'force-dynamic'

export default async function CitiesPage() {
  const cities = await listCitiesAction()
  return (
    <>
      <PageHeader
        title="Cities"
        description={`${cities.length} total. Disabled cities are hidden from the mobile app.`}
        actions={
          <Button asChild>
            <Link href="/discover/cities/new">
              <Plus className="h-4 w-4" />
              New city
            </Link>
          </Button>
        }
      />
      <CitiesTable cities={cities} />
    </>
  )
}
