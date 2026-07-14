import 'server-only'

// Fire-and-forget on-demand revalidation for the public web. Called
// after admin blog CRUD so /blog surfaces show new / edited posts
// immediately instead of waiting for the 1h ISR window.
//
// Web is a separate Vercel project from admin, so admin's own
// revalidatePath() calls don't touch it. We POST to a dedicated route
// on the web app with a shared secret.
//
// Failure never propagates to the caller. If the web is down or the
// secret is misconfigured, blog CRUD still succeeds — the change just
// takes up to 1h to appear on the public site instead of instantly.
// This is the same failure mode as if we hadn't wired revalidation up
// at all, so no upside to blocking the admin action on it.

const WEB_BASE =
  process.env.WEB_URL?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ??
  'http://localhost:3000'

const SECRET = process.env.REVALIDATE_SECRET

export async function revalidateWebPaths(paths: string[]): Promise<void> {
  if (!SECRET) {
    // Configured off — treat as a no-op. Local dev without the env var
    // set is a common case; noisy logs would drown out real errors.
    return
  }
  if (paths.length === 0) return
  const url = `${WEB_BASE}/api/revalidate?secret=${encodeURIComponent(SECRET)}`
  try {
    // 3s timeout — this is a background call, not a request the user
    // is waiting on. If web is slow / dead we bail cleanly.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
        signal: controller.signal,
        // no-store because this is a mutation, not a fetch we want
        // Next to cache.
        cache: 'no-store',
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    // Swallow — see the failure-mode note above. Server logs still
    // record it for debugging.
    console.warn('revalidateWebPaths failed', err)
  }
}

// Convenience wrapper: given a blog slug + optional category (before
// and after states), invalidate every affected public web path.
//   /blog                      always
//   /blog/[slug]               always
//   /blog/category/[c]         for the current category (and previous,
//                              if the category changed on edit)
export async function revalidateBlogPaths(opts: {
  slug: string
  category?: string
  previousCategory?: string
}): Promise<void> {
  const paths = new Set<string>()
  paths.add('/blog')
  paths.add(`/blog/${opts.slug}`)
  if (opts.category) paths.add(`/blog/category/${opts.category}`)
  if (opts.previousCategory && opts.previousCategory !== opts.category) {
    paths.add(`/blog/category/${opts.previousCategory}`)
  }
  await revalidateWebPaths(Array.from(paths))
}
