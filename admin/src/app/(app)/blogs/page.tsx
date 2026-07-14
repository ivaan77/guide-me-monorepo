import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listBlogsAction } from '@/actions/blogs'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/forms/page-header'
import { BlogsTable } from './blogs-table'

export const dynamic = 'force-dynamic'

export default async function BlogsPage() {
  const posts = await listBlogsAction()
  const publishedCount = posts.filter((p) => p.status === 'published').length
  return (
    <>
      <PageHeader
        title="Blog"
        description={`${posts.length} total · ${publishedCount} published`}
        actions={
          <Button asChild>
            <Link href="/blogs/new">
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </Button>
        }
      />
      <BlogsTable posts={posts} />
    </>
  )
}
