import { notFound } from 'next/navigation'
import { getBlogAction } from '@/actions/blogs'
import { PageHeader } from '@/components/forms/page-header'
import { BlogForm } from '../blog-form'

export const dynamic = 'force-dynamic'

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const post = await getBlogAction(slug)
    return (
      <>
        <PageHeader
          title={post.title.en || post.slug}
          description={`Status: ${post.status} · /blog/${post.slug}`}
        />
        <BlogForm mode="edit" initialValues={post} />
      </>
    )
  } catch {
    notFound()
  }
}
