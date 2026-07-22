import { listCitiesAction } from '@/actions/cities'
import { getDraftAction } from '@/actions/drafts'
import { PageHeader } from '@/components/forms/page-header'
import { BlogForm, type BlogFormCity } from '../blog-form'

export const dynamic = 'force-dynamic'

export default async function NewBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const sp = await searchParams
  const draftSlug = sp.draft?.trim() || undefined
  const [cities, draft] = await Promise.all([
    listCitiesAction(),
    draftSlug ? getDraftAction('blog', draftSlug) : Promise.resolve(null),
  ])
  const options: BlogFormCity[] = cities.map((c) => ({
    slug: c.slug,
    name: c.name.en,
  }))
  return (
    <>
      <PageHeader
        title="New post"
        description="Save as draft to preview before publishing."
      />
      <BlogForm mode="create" cities={options} initialDraft={draft} />
    </>
  )
}
