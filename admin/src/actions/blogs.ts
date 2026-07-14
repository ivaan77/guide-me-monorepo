'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AdminPath } from '@guide-me-app/core'
import type {
  AdminBlog,
  AdminBlogListResponse,
  AdminBlogResponse,
  AdminCreateBlogRequest,
  AdminUpdateBlogRequest,
} from '@guide-me-app/core'
import { adminApi, ApiError } from '@/lib/api'
import { revalidateBlogPaths } from '@/lib/revalidate-web'
import type { ActionResult } from './cities'

export async function listBlogsAction(): Promise<AdminBlog[]> {
  const res = await adminApi.get<AdminBlogListResponse>(AdminPath.Blog.posts)
  return res.posts
}

export async function getBlogAction(slug: string): Promise<AdminBlog> {
  const res = await adminApi.get<AdminBlogResponse>(AdminPath.Blog.getPost(slug))
  return res.post
}

export async function createBlogAction(
  input: AdminCreateBlogRequest,
): Promise<ActionResult<AdminBlog>> {
  try {
    const res = await adminApi.post<AdminBlogResponse>(
      AdminPath.Blog.posts,
      input,
    )
    revalidatePath('/blogs')
    // Fire-and-forget public web revalidation. Drafts don't render on
    // web, but a fresh call is idempotent — safer to always invalidate
    // than to guard on status here and race the publish toggle.
    await revalidateBlogPaths({
      slug: res.post.slug,
      category: res.post.category,
    })
    return { ok: true, data: res.post }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function updateBlogAction(
  slug: string,
  input: AdminUpdateBlogRequest,
): Promise<ActionResult<AdminBlog>> {
  try {
    // Read the current doc so we know the PREVIOUS category — needed
    // to invalidate the old category page if the update changes it.
    // One extra round-trip on every update; acceptable at this scale.
    let previousCategory: string | undefined
    try {
      const before = await adminApi.get<AdminBlogResponse>(
        AdminPath.Blog.getPost(slug),
      )
      previousCategory = before.post.category
    } catch {
      // If we can't read the previous doc, proceed with just the new
      // category invalidation. Missing the old one just means the
      // stale category page waits for the 1h ISR window.
    }
    const res = await adminApi.patch<AdminBlogResponse>(
      AdminPath.Blog.getPost(slug),
      input,
    )
    revalidatePath('/blogs')
    revalidatePath(`/blogs/${slug}`)
    await revalidateBlogPaths({
      slug: res.post.slug,
      category: res.post.category,
      previousCategory,
    })
    return { ok: true, data: res.post }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function deleteBlogAction(slug: string): Promise<ActionResult> {
  try {
    // Read the doc before delete so we know its category (deleted post
    // still needs its category page invalidated). Best-effort.
    let category: string | undefined
    try {
      const before = await adminApi.get<AdminBlogResponse>(
        AdminPath.Blog.getPost(slug),
      )
      category = before.post.category
    } catch {
      // 404 is fine — nothing to revalidate specifically, /blog is
      // enough.
    }
    await adminApi.delete(AdminPath.Blog.getPost(slug))
    revalidatePath('/blogs')
    await revalidateBlogPaths({ slug, category })
    return { ok: true, data: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function createBlogRedirect(input: AdminCreateBlogRequest) {
  const res = await createBlogAction(input)
  if (res.ok) redirect(`/blogs/${res.data.slug}`)
  return res
}

// Rotates the previewToken. Any preview URLs already in the wild for this
// slug stop working immediately. Returns the updated post so the client
// can immediately open the new preview URL without refetching.
export async function regeneratePreviewTokenAction(
  slug: string,
): Promise<ActionResult<AdminBlog>> {
  try {
    const res = await adminApi.post<AdminBlogResponse>(
      AdminPath.Blog.getPreviewToken(slug),
      {},
    )
    revalidatePath(`/blogs/${slug}`)
    // Invalidate the web preview route so the old token's cached page
    // stops rendering. /blog/preview/[slug] uses `dynamic = 'force-
    // dynamic'` already, so this is belt-and-suspenders — safe no-op
    // if the route isn't in cache.
    await revalidateBlogPaths({
      slug: res.post.slug,
      category: res.post.category,
    })
    return { ok: true, data: res.post }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}
