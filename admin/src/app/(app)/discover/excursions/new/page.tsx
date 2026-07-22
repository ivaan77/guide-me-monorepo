import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
import { listExcursionsAction } from '@/actions/excursions'
import { PageHeader } from '@/components/forms/page-header'
import { ExcursionForm } from '../excursion-form'

export const dynamic = 'force-dynamic'

export default async function NewExcursionPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const sp = await searchParams
  const draftSlug = sp.draft?.trim() || undefined
  const [cities, excursions, draft] = await Promise.all([
    listCitiesAction(),
    listExcursionsAction(),
    // Only fetch a draft when the "resume draft" query param is set.
    // Without this, opening the New page fresh would silently restore
    // whatever half-typed thing the user last abandoned — we want the
    // list-page banner to be the explicit opt-in.
    draftSlug ? getDraftAction('excursion', draftSlug) : Promise.resolve(null),
  ])
  return (
    <>
      <PageHeader title="New excursion" backHref="/discover/excursions" />
      <ExcursionForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        existingSlugs={excursions.map((e) => e.slug)}
        initialDraft={draft}
      />
    </>
  )
}
