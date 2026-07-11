import { PageHeader } from '@/components/forms/page-header'
import { BlogForm } from '../blog-form'

export default function NewBlogPage() {
  return (
    <>
      <PageHeader
        title="New post"
        description="Save as draft to preview before publishing."
      />
      <BlogForm mode="create" />
    </>
  )
}
