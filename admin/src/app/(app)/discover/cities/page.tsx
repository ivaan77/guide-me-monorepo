import Link from 'next/link'
import { listCitiesAction } from '@/actions/cities'
import { listDraftsAction } from '@/actions/drafts'
import { Button } from '@/components/ui/button'
import {
  DraftsBanner,
  type DraftBannerRow,
} from '@/components/forms/drafts-banner'
import { PageHeader } from '@/components/forms/page-header'
import { Plus } from 'lucide-react'
import { CitiesTable } from './cities-table'

function labelForCityDraft(payload: unknown): string {
  const p = payload as { name?: { en?: string } } | null
  return p?.name?.en?.trim() || ''
}

export const dynamic = 'force-dynamic'

export default async function CitiesPage() {
  const [cities, drafts] = await Promise.all([
    listCitiesAction(),
    listDraftsAction('city'),
  ])
  return (
    <>
      <PageHeader
        title="Cities"
        description={`${cities.length} total. Disabled cities are hidden from the mobile app.`}
        actions={
          <Button asChild>
            <Link href="/discover/cities/new">
              <Plus className="h-4 w-4" />
              New city
            </Link>
          </Button>
        }
      />
      <DraftsBanner
        entityType="city"
        rows={drafts.map<DraftBannerRow>((d) => ({
          slug: d.slug,
          isNew: d.isNew,
          updatedAt: d.updatedAt,
          label: labelForCityDraft(d.payload),
          href: d.isNew
            ? `/discover/cities/new?draft=${encodeURIComponent(d.slug)}`
            : `/discover/cities/${encodeURIComponent(d.slug)}`,
        }))}
      />
      <CitiesTable cities={cities} />
    </>
  )
}
