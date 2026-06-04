import { listCitiesAction } from '@/actions/cities'
import { PageHeader } from '@/components/forms/page-header'
import { CityForm } from '../city-form'

export const dynamic = 'force-dynamic'

export default async function NewCityPage() {
  // Existing slugs are passed to the form so the auto-generated slug can
  // skip past collisions (lisbon → lisbon-2 if "lisbon" exists already).
  const cities = await listCitiesAction()
  return (
    <>
      <PageHeader title="New city" backHref="/discover/cities" />
      <CityForm
        mode="create"
        existingSlugs={cities.map((c) => c.slug)}
      />
    </>
  )
}
