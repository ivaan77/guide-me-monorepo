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
    const res = await adminApi.patch<AdminBlogResponse>(
      AdminPath.Blog.getPost(slug),
      input,
    )
    revalidatePath('/blogs')
    revalidatePath(`/blogs/${slug}`)
    return { ok: true, data: res.post }
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : String(err) }
  }
}

export async function deleteBlogAction(slug: string): Promise<ActionResult> {
  try {
    await adminApi.delete(AdminPath.Blog.getPost(slug))
    revalidatePath('/blogs')
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
