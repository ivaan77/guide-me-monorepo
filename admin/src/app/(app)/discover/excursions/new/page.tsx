import { listCitiesAction } from '@/actions/cities'
import { listExcursionsAction } from '@/actions/excursions'
import { PageHeader } from '@/components/forms/page-header'
import { ExcursionForm } from '../excursion-form'

export const dynamic = 'force-dynamic'

export default async function NewExcursionPage() {
  const [cities, excursions] = await Promise.all([
    listCitiesAction(),
    listExcursionsAction(),
  ])
  return (
    <>
      <PageHeader title="New excursion" backHref="/discover/excursions" />
      <ExcursionForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        existingSlugs={excursions.map((e) => e.slug)}
      />
    </>
  )
}
