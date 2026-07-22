import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listBlogsAction } from '@/actions/blogs'
import { listDraftsAction } from '@/actions/drafts'
import { Button } from '@/components/ui/button'
import {
  DraftsBanner,
  type DraftBannerRow,
} from '@/components/forms/drafts-banner'
import { PageHeader } from '@/components/forms/page-header'
import { BlogsTable } from './blogs-table'

function labelForBlogDraft(payload: unknown): string {
  const p = payload as { title?: { en?: string } } | null
  return p?.title?.en?.trim() || ''
}

export const dynamic = 'force-dynamic'

export default async function BlogsPage() {
  const [posts, drafts] = await Promise.all([
    listBlogsAction(),
    listDraftsAction('blog'),
  ])
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
      <DraftsBanner
        entityType="blog"
        rows={drafts.map<DraftBannerRow>((d) => ({
          slug: d.slug,
          isNew: d.isNew,
          updatedAt: d.updatedAt,
          label: labelForBlogDraft(d.payload),
          href: d.isNew
            ? `/blogs/new?draft=${encodeURIComponent(d.slug)}`
            : `/blogs/${encodeURIComponent(d.slug)}`,
        }))}
      />
      <BlogsTable posts={posts} />
    </>
  )
}
