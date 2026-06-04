import { listCitiesAction } from '@/actions/cities'
import { listPlacesAction } from '@/actions/places'
import { PageHeader } from '@/components/forms/page-header'
import { PlaceForm } from '../place-form'

export const dynamic = 'force-dynamic'

export default async function NewPlacePage() {
  const [cities, places] = await Promise.all([
    listCitiesAction(),
    listPlacesAction(),
  ])
  return (
    <>
      <PageHeader title="New place" backHref="/discover/places" />
      <PlaceForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        existingSlugs={places.map((p) => p.slug)}
      />
    </>
  )
}
