import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
import { PageHeader } from '@/components/forms/page-header'
import { CityForm } from '../city-form'

export const dynamic = 'force-dynamic'

export default async function NewCityPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const sp = await searchParams
  const draftSlug = sp.draft?.trim() || undefined
  // Existing slugs are passed to the form so the auto-generated slug can
  // skip past collisions (lisbon → lisbon-2 if "lisbon" exists already).
  const [cities, draft] = await Promise.all([
    listCitiesAction(),
    draftSlug ? getDraftAction('city', draftSlug) : Promise.resolve(null),
  ])
  return (
    <>
      <PageHeader title="New city" backHref="/discover/cities" />
      <CityForm
        mode="create"
        existingSlugs={cities.map((c) => c.slug)}
        initialDraft={draft}
      />
    </>
  )
}
