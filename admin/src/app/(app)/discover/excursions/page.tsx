import Link from 'next/link'
import { listCitiesAction } from '@/actions/cities'
import { listDraftsAction } from '@/actions/drafts'
import { listExcursionsAction } from '@/actions/excursions'
import { Button } from '@/components/ui/button'
import {
  DraftsBanner,
  type DraftBannerRow,
} from '@/components/forms/drafts-banner'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { ExcursionsTable } from './excursions-table'
import { ExcursionsFilters } from './excursions-filters'

// Extract a display label from an excursion draft's payload. The
// payload is CreateValues (name.en + slug etc.), but we cast to
// unknown at the banner boundary; unpack defensively here.
function labelForExcursionDraft(payload: unknown): string {
  const p = payload as { name?: { en?: string } } | null
  return p?.name?.en?.trim() || ''
}

export const dynamic = 'force-dynamic'

export default async function ExcursionsPage({
  searchParams,
}: {
  searchParams: Promise<{ citySlug?: string }>
}) {
  const sp = await searchParams
  const citySlug = sp.citySlug || undefined
  const [excursions, cities, drafts] = await Promise.all([
    listExcursionsAction(citySlug),
    listCitiesAction(),
    listDraftsAction('excursion'),
  ])
  return (
    <>
      <PageHeader
        title="Excursions"
        description={`${excursions.length} matching.`}
        actions={
          <Button asChild>
            <Link href="/discover/excursions/new">
              <Plus className="h-4 w-4" />
              New excursion
            </Link>
          </Button>
        }
      />
      <DraftsBanner
        entityType="excursion"
        rows={drafts.map<DraftBannerRow>((d) => ({
          slug: d.slug,
          isNew: d.isNew,
          updatedAt: d.updatedAt,
          label: labelForExcursionDraft(d.payload),
          href: d.isNew
            ? `/discover/excursions/new?draft=${encodeURIComponent(d.slug)}`
            : `/discover/excursions/${encodeURIComponent(d.slug)}`,
        }))}
      />
      <ExcursionsFilters
        cities={cities.map((c) => ({ slug: c.slug, name: c.name.en }))}
        currentCitySlug={citySlug}
      />
      <ExcursionsTable excursions={excursions} />
    </>
  )
}
