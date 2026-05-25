import { listCitiesAction } from '@/actions/cities'
import { PageHeader } from '@/components/forms/page-header'
import { PlaceForm } from '../place-form'

export default async function NewPlacePage() {
  const cities = await listCitiesAction()
  return (
    <>
      <PageHeader title="New place" backHref="/discover/places" />
      <PlaceForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
      />
    </>
  )
}
