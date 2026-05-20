import { listCitiesAction } from '@/actions/cities'
import { PageHeader } from '@/components/forms/page-header'
import { ExcursionForm } from '../excursion-form'

export default async function NewExcursionPage() {
  const cities = await listCitiesAction()
  return (
    <>
      <PageHeader title="New excursion" backHref="/discover/excursions" />
      <ExcursionForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
      />
    </>
  )
}
