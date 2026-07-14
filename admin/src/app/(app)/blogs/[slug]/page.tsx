import { notFound } from 'next/navigation'
import { getBlogAction } from '@/actions/blogs'
import { listCitiesAction } from '@/actions/cities'
import { PageHeader } from '@/components/forms/page-header'
import { BlogForm, type BlogFormCity } from '../blog-form'

export const dynamic = 'force-dynamic'

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const [post, cities] = await Promise.all([
      getBlogAction(slug),
      listCitiesAction(),
    ])
    const options: BlogFormCity[] = cities.map((c) => ({
      slug: c.slug,
      name: c.name.en,
    }))
    return (
      <>
        <PageHeader
          title={post.title.en || post.slug}
          description={`Status: ${post.status} · /blog/${post.slug}`}
        />
        <BlogForm mode="edit" initialValues={post} cities={options} />
      </>
    )
  } catch {
    notFound()
  }
}
