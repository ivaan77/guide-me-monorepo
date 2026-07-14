import {
    BlogCategory,
    BlogStatus,
    LocalizedRichText,
    LocalizedString,
} from '../public'

// Admin blog shape: raw localized fields (not pre-resolved), full editable
// surface. Different from PublicBlogSummary/PublicBlogDetail which resolve
// to a single locale before responding to web/mobile clients.

export type AdminBlog = {
    slug: string
    status: BlogStatus
    category: BlogCategory

    // Optional city tie. When set, the post surfaces in the mobile
    // Stories tab city filter and in the CityDetailScreen "Related
    // stories" section. Absent = general / not tied to any city.
    // Soft link to DiscoverCity.slug (no FK enforcement).
    citySlug?: string

    // Cover image URL rendered on the blog card + at the top of the detail
    // page. Uploaded via the same image pipeline as cities/places.
    coverImage: string

    // Optional OG image for social share cards. Falls back to coverImage
    // when unset — captured as "reuses cover" in the admin UI.
    ogImage?: string

    // Localized title + rich-text body. English is required; other locales
    // are optional and fall back at render time.
    title: LocalizedString
    // Free-text plain-string excerpt (~160 chars) shown on the card. Author
    // writes it; not auto-truncated from body so the summary can be
    // marketing-shaped rather than a chunk-cut of the article.
    excerpt: LocalizedString
    body: LocalizedRichText

    // SEO overrides — optional per-locale. When unset, web falls back to
    // title/excerpt for meta title/description respectively.
    metaTitle?: LocalizedString
    metaDescription?: LocalizedString

    // ISO timestamp populated by the server on first publish. Stays fixed
    // across draft-published-draft cycles so search engines don't see the
    // post as "new" every time it's edited. Undefined on draft-only posts.
    publishedAt?: string

    // Server-managed mongoose timestamps. Included so the list page can
    // sort "recently edited drafts."
    createdAt: string
    updatedAt: string

    // Random token that gates the public preview endpoint for drafts.
    // Admin-only — never included in PublicBlog projections. Combine with
    // the slug to build the shareable preview URL.
    previewToken: string
}

// Payload for POST /admin/blogs. Slug is chosen by the author (unique) —
// unlike cities/places where a helper derives it from the name, blog
// slugs benefit from author intent (SEO-friendly URLs). Status defaults
// to 'draft' on create. previewToken is server-generated; body-provided
// values are ignored.
export type AdminCreateBlogRequest = Omit<
    AdminBlog,
    'createdAt' | 'updatedAt' | 'publishedAt' | 'previewToken'
>

// PATCH /admin/blogs/:slug — all fields optional except the ones we set
// server-side. The slug in the URL identifies the post; the body may not
// change the slug (slug rename is a delete+create for now).
export type AdminUpdateBlogRequest = Partial<
    Omit<
        AdminBlog,
        'slug' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'previewToken'
    >
>

export type AdminBlogListResponse = {
    posts: AdminBlog[]
}

export type AdminBlogResponse = {
    post: AdminBlog
}
