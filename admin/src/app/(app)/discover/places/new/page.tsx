import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
import { listPlacesAction } from '@/actions/places'
import { PageHeader } from '@/components/forms/page-header'
import { PlaceForm } from '../place-form'

export const dynamic = 'force-dynamic'

export default async function NewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const sp = await searchParams
  const draftSlug = sp.draft?.trim() || undefined
  const [cities, places, draft] = await Promise.all([
    listCitiesAction(),
    listPlacesAction(),
    draftSlug ? getDraftAction('place', draftSlug) : Promise.resolve(null),
  ])
  return (
    <>
      <PageHeader title="New place" backHref="/discover/places" />
      <PlaceForm
        mode="create"
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        existingSlugs={places.map((p) => p.slug)}
        initialDraft={draft}
      />
    </>
  )
}
