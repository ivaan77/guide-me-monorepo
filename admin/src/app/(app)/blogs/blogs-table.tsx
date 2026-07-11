'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import type { AdminBlog, BlogCategory } from '@guide-me-app/core'
import { deleteBlogAction, updateBlogAction } from '@/actions/blogs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

export function BlogsTable({ posts }: { posts: AdminBlog[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggleStatus = (post: AdminBlog) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      const res = await updateBlogAction(post.slug, { status: nextStatus })
      if (!res.ok) {
        toast.error(`Failed to update ${post.slug}`, { description: res.error })
        return
      }
      toast.success(
        nextStatus === 'published'
          ? `${post.slug} published`
          : `${post.slug} moved to draft`,
      )
      router.refresh()
    })
  }

  const remove = (post: AdminBlog) => {
    if (!confirm(`Delete post "${post.slug}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteBlogAction(post.slug)
      if (!res.ok) {
        toast.error(`Cannot delete ${post.slug}`, { description: res.error })
        return
      }
      toast.success(`Deleted ${post.slug}`)
      router.refresh()
    })
  }

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No posts yet. Create one to get started.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => (
        <Card key={post.slug} className="flex items-center gap-3 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt=""
            className="h-14 w-14 rounded-md object-cover bg-[var(--color-muted)]"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {post.title.en}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  post.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {post.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <span>{CATEGORY_LABEL[post.category]}</span>
              <span>·</span>
              <span>/blog/{post.slug}</span>
              {post.publishedAt && (
                <>
                  <span>·</span>
                  <span>
                    Published {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatus(post)}
              disabled={isPending}
            >
              {post.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
            <Button asChild variant="outline" size="icon">
              <Link href={`/blogs/${post.slug}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => remove(post)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
