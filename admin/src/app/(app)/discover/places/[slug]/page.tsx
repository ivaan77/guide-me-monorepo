import { notFound } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
import { getPlaceAction, getPlaceReferencesAction } from '@/actions/places'
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
    const [place, cities, references, draft] = await Promise.all([
      getPlaceAction(slug),
      listCitiesAction(),
      getPlaceReferencesAction(slug),
      getDraftAction('place', slug),
    ])
    const notVisible = references.cities === 0 && references.excursions === 0
    return (
      <>
        <PageHeader
          title={place.name.en}
          description={`${place.slug} · ${place.category} · ${place.citySlug}`}
          backHref="/discover/places"
        />
        {notVisible && (
          <div
            className="flex items-start gap-3 rounded-md border p-4 mb-4"
            style={{
              borderColor: 'var(--color-warning, #f59e0b)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <AlertTriangle
              className="h-5 w-5 mt-0.5 shrink-0"
              style={{ color: 'var(--color-warning, #f59e0b)' }}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">
                This place isn't visible to users yet
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                A place becomes visible only when it's referenced from
                somewhere. Add this place's slug{' '}
                <code className="font-mono">{place.slug}</code> to a city's{' '}
                <em>Places in this city</em> list (so it appears on the city
                detail screen), or add it as a POI in an excursion (so it
                appears on the excursion map and stops list).
              </p>
            </div>
          </div>
        )}
        <PlaceForm
          mode="edit"
          cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
          initialValues={place}
          initialDraft={draft}
        />
      </>
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
}
