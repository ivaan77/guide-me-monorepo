import { notFound } from 'next/navigation'
import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
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
    // Fetch the draft alongside the saved entity. If a draft exists the
    // form surfaces a "Load draft / Discard" banner so the user opts in
    // — never silently overwrite the saved data.
    const [excursion, cities, draft] = await Promise.all([
      getExcursionAction(slug),
      listCitiesAction(),
      getDraftAction('excursion', slug),
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
          initialDraft={draft}
        />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
