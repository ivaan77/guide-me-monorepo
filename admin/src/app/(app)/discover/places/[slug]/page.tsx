import { notFound } from 'next/navigation'
import { listCitiesAction } from '@/actions/cities'
import { getPlaceAction } from '@/actions/places'
import { ApiError } from '@/lib/api'
import { PageHeader } from '@/components/forms/page-header'
import { PlaceForm } from '../place-form'

export const dynamic = 'force-dynamic'

export default async function EditPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const [place, cities] = await Promise.all([
      getPlaceAction(slug),
      listCitiesAction(),
    ])
    return (
      <>
        <PageHeader
          title={place.name.en}
          description={`${place.slug} · ${place.category} · ${place.citySlug}`}
          backHref="/discover/places"
        />
        <PlaceForm
          mode="edit"
          cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
          initialValues={place}
        />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
