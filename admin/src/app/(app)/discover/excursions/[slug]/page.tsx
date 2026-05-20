import { notFound } from 'next/navigation'
import { listCitiesAction } from '@/actions/cities'
import { getExcursionAction } from '@/actions/excursions'
import { ApiError } from '@/lib/api'
import { PageHeader } from '@/components/forms/page-header'
import { ExcursionForm } from '../excursion-form'

export const dynamic = 'force-dynamic'

export default async function EditExcursionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const [excursion, cities] = await Promise.all([
      getExcursionAction(slug),
      listCitiesAction(),
    ])
    return (
      <>
        <PageHeader
          title={excursion.name.en}
          description={`${excursion.slug} · ${excursion.citySlug}`}
          backHref="/discover/excursions"
        />
        <ExcursionForm
          mode="edit"
          cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
          initialValues={excursion}
        />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
