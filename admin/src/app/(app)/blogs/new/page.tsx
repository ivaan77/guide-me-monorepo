import { listCitiesAction } from '@/actions/cities'
import { PageHeader } from '@/components/forms/page-header'
import { BlogForm, type BlogFormCity } from '../blog-form'

export const dynamic = 'force-dynamic'

export default async function NewBlogPage() {
  const cities = await listCitiesAction()
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
      <BlogForm mode="create" cities={options} />
    </>
  )
}
