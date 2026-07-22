import { notFound } from 'next/navigation'
import { getCityAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
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
    const [city, draft] = await Promise.all([
      getCityAction(slug),
      getDraftAction('city', slug),
    ])
    return (
      <>
        <PageHeader
          title={city.name.en}
          description={city.slug}
          backHref="/discover/cities"
        />
        <CityForm mode="edit" initialValues={city} initialDraft={draft} />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
