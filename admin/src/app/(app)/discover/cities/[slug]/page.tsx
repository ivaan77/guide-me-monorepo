import { notFound } from 'next/navigation'
import { getCityAction } from '@/actions/cities'
import { ApiError } from '@/lib/api'
import { PageHeader } from '@/components/forms/page-header'
import { CityForm } from '../city-form'

export const dynamic = 'force-dynamic'

export default async function EditCityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const city = await getCityAction(slug)
    return (
      <>
        <PageHeader
          title={city.name.en}
          description={city.slug}
          backHref="/discover/cities"
        />
        <CityForm mode="edit" initialValues={city} />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
