'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type {
  AdminBlog,
  AdminCreateBlogRequest,
  AdminUpdateBlogRequest,
  BlogCategory,
  TipTapDoc,
} from '@guide-me-app/core'
import { BLOG_CATEGORIES, BLOG_STATUSES } from '@guide-me-app/core'
import {
  createBlogAction,
  regeneratePreviewTokenAction,
  updateBlogAction,
} from '@/actions/blogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LocalizedInput } from '@/components/forms/localized-input'
import { LocalizedRichText } from '@/components/forms/localized-rich-text'
import { ImageInput } from '@/components/forms/image-input'
import { slugify } from '@/lib/slug'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  'travel-tips': 'Travel tips',
  'city-guide': 'City guide',
  'food-drink': 'Food & drink',
  news: 'News',
}

const localizedRequired = z.object({
  en: z.string().min(1, 'English is required'),
  de: z.string().optional(),
  hr: z.string().optional(),
})

const localizedOptional = z.object({
  en: z.string().optional(),
  de: z.string().optional(),
  hr: z.string().optional(),
})

// TipTap doc validation is loose — we trust the editor to produce a well-
// formed tree. Just require `en` to have at least the doc-root type set.
const tiptapDoc = z
  .object({
    type: z.literal('doc'),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough()

const localizedRichRequired = z.object({
  en: tiptapDoc,
  de: tiptapDoc.optional(),
  hr: tiptapDoc.optional(),
})

const baseSchema = {
  status: z.enum(BLOG_STATUSES),
  category: z.enum(BLOG_CATEGORIES),
  // Empty string = "General" (no city). Any non-empty must match the
  // slug shape; the API also enforces this but we short-circuit on the
  // client so the author sees the error in the form rather than a toast.
  citySlug: z
    .string()
    .refine(
      (v) => v === '' || SLUG_REGEX.test(v),
      'Must be a valid city slug',
    ),
  coverImage: z.string().url('Must be a valid URL'),
  ogImage: z.string().url().optional().or(z.literal('')),
  title: localizedRequired,
  excerpt: localizedRequired,
  body: localizedRichRequired,
  metaTitle: localizedOptional.optional(),
  metaDescription: localizedOptional.optional(),
}

const createSchema = z.object({
  slug: z.string().regex(SLUG_REGEX, 'Lowercase letters, numbers, hyphens only'),
  ...baseSchema,
})

const updateSchema = z.object(baseSchema)

type CreateValues = z.infer<typeof createSchema>
type UpdateValues = z.infer<typeof updateSchema>

// Compact shape passed by the page-level server components after
// listCitiesAction() so the client form doesn't need to re-fetch or
// hold the full AdminCity payload.
export type BlogFormCity = { slug: string; name: string }

type Props =
  | { mode: 'create'; initialValues?: undefined; cities: BlogFormCity[] }
  | { mode: 'edit'; initialValues: AdminBlog; cities: BlogFormCity[] }

const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [] }

export function BlogForm(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Local mirror of previewToken so a click on "Regenerate" updates the
  // Preview button's URL immediately, without waiting for router.refresh
  // to round-trip the whole page. In create mode this stays at '' — the
  // Preview button isn't rendered.
  const [previewToken, setPreviewToken] = useState<string>(
    props.mode === 'edit' ? props.initialValues.previewToken : '',
  )

  const defaults =
    props.mode === 'edit'
      ? {
          status: props.initialValues.status,
          category: props.initialValues.category,
          citySlug: props.initialValues.citySlug ?? '',
          coverImage: props.initialValues.coverImage,
          ogImage: props.initialValues.ogImage ?? '',
          title: props.initialValues.title,
          excerpt: props.initialValues.excerpt,
          body: props.initialValues.body,
          metaTitle: props.initialValues.metaTitle,
          metaDescription: props.initialValues.metaDescription,
        }
      : {
          status: 'draft' as const,
          category: 'travel-tips' as BlogCategory,
          citySlug: '',
          coverImage: '',
          ogImage: '',
          title: { en: '', de: '', hr: '' },
          excerpt: { en: '', de: '', hr: '' },
          body: { en: EMPTY_DOC, de: undefined, hr: undefined },
          metaTitle: undefined,
          metaDescription: undefined,
        }

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      slug: '',
      ...defaults,
    } as CreateValues,
  })

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: defaults as UpdateValues,
  })

  const form = props.mode === 'create' ? createForm : updateForm
  const { control, register, handleSubmit, setValue, watch, formState } = form as unknown as ReturnType<
    typeof useForm<CreateValues>
  >

  // Live auto-slug: while the user is authoring the EN title in create
  // mode, keep the slug field in sync with slugify(title). The slug input
  // is read-only so there's no manual override — the field always tracks
  // the title. Edit mode never touches the slug (it's the DB key + URL).
  const titleEn = watch('title.en' as never) as unknown as string | undefined
  const slug = watch('slug' as never) as unknown as string | undefined
  const suggestedSlug = slugify(titleEn ?? '')

  useEffect(() => {
    if (props.mode !== 'create') return
    if (!suggestedSlug) return
    // setValue with shouldValidate:false so we don't fire the zod slug
    // regex check on every keystroke of the title.
    setValue('slug' as never, suggestedSlug as never, { shouldValidate: false })
  }, [suggestedSlug, setValue, props.mode])

  const onCreate = handleSubmit((values: CreateValues) => {
    startTransition(async () => {
      const payload: AdminCreateBlogRequest = {
        slug: values.slug,
        status: values.status,
        category: values.category,
        citySlug: values.citySlug || undefined,
        coverImage: values.coverImage,
        ogImage: values.ogImage || undefined,
        title: values.title,
        excerpt: values.excerpt,
        body: values.body as AdminCreateBlogRequest['body'],
        metaTitle: toLocalizedOrUndefined(values.metaTitle),
        metaDescription: toLocalizedOrUndefined(values.metaDescription),
      }
      const res = await createBlogAction(payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Post created')
      router.push(`/blogs/${res.data.slug}`)
    })
  })

  const onUpdate = handleSubmit((values: CreateValues) => {
    if (props.mode !== 'edit') return
    startTransition(async () => {
      const payload: AdminUpdateBlogRequest = {
        status: values.status,
        category: values.category,
        // Empty string is meaningful on update — it signals "clear the
        // city tie" to the API. Pass through as-is.
        citySlug: values.citySlug,
        coverImage: values.coverImage,
        ogImage: values.ogImage || undefined,
        title: values.title,
        excerpt: values.excerpt,
        body: values.body as AdminUpdateBlogRequest['body'],
        metaTitle: toLocalizedOrUndefined(values.metaTitle),
        metaDescription: toLocalizedOrUndefined(values.metaDescription),
      }
      const res = await updateBlogAction(props.initialValues.slug, payload)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Post updated')
      router.refresh()
    })
  })

  return (
    <form
      onSubmit={props.mode === 'create' ? onCreate : onUpdate}
      className="flex flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {props.mode === 'create' && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder={suggestedSlug || 'top-5-zagreb-excursions'}
                {...register('slug')}
                readOnly
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                URL segment: /blog/<code>{slug || suggestedSlug || 'slug'}</code>
                {titleEn && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide">
                    · auto from title
                  </span>
                )}
              </p>
              {formState.errors.slug && (
                <p className="text-xs text-[var(--color-destructive)]">
                  {formState.errors.slug.message as string}
                </p>
              )}
            </div>
          )}
          {props.mode === 'edit' && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="slug-locked">Slug (locked)</Label>
              <Input
                id="slug-locked"
                value={props.initialValues.slug}
                disabled
                readOnly
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                URL segment: /blog/<code>{props.initialValues.slug}</code>{' '}
                · changing this would break existing links + SEO. To rename,
                delete this post and create a new one.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status' as never) as unknown as string}
                onValueChange={(v) => setValue('status' as never, v as never)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft — admin only</SelectItem>
                  <SelectItem value="published">Published — live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('category' as never) as unknown as string}
                onValueChange={(v) => setValue('category' as never, v as never)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="citySlug">Tied to city</Label>
            <Select
              // Radix Select rejects empty-string values, so we mirror the
              // "no city" state to the sentinel __none and translate at the
              // read/write boundary. Empty string ↔ __none.
              value={
                ((watch('citySlug' as never) as unknown as string) || '') ===
                ''
                  ? '__none'
                  : ((watch('citySlug' as never) as unknown as string) ?? '__none')
              }
              onValueChange={(v) =>
                setValue(
                  'citySlug' as never,
                  (v === '__none' ? '' : v) as never,
                )
              }
            >
              <SelectTrigger id="citySlug">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">
                  General — not tied to any city
                </SelectItem>
                {props.cities.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Tied posts surface in the Stories tab city filter and on the
              city&apos;s detail screen in the mobile app.
            </p>
          </div>

          <LocalizedInput
            control={control}
            name={'title' as never}
            label="Title"
            required
            placeholder="Top 5 outdoor excursions in Zagreb"
          />

          <LocalizedInput
            control={control}
            name={'excerpt' as never}
            label="Excerpt"
            required
            multiline
            placeholder="A one-paragraph summary shown on cards and social share previews."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
        </CardHeader>
        <CardContent>
          <LocalizedRichText
            control={control}
            name={'body' as never}
            label=""
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover & social</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ImageInput
            control={control}
            name={'coverImage' as never}
            label="Cover image URL"
            required
          />
          <ImageInput
            control={control}
            name={'ogImage' as never}
            label="OG / social share image URL (optional)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO overrides (optional)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Leave blank to reuse the post title + excerpt as meta title +
            description.
          </p>
          <LocalizedInput
            control={control}
            name={'metaTitle' as never}
            label="Meta title"
          />
          <LocalizedInput
            control={control}
            name={'metaDescription' as never}
            label="Meta description"
            multiline
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        {props.mode === 'edit' && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  !confirm(
                    'Regenerate preview token? Any preview URLs you have already shared will stop working.',
                  )
                ) {
                  return
                }
                startTransition(async () => {
                  const res = await regeneratePreviewTokenAction(
                    props.initialValues.slug,
                  )
                  if (!res.ok) {
                    toast.error(res.error)
                    return
                  }
                  setPreviewToken(res.data.previewToken)
                  toast.success(
                    'Preview token regenerated — old links no longer work',
                  )
                })
              }}
              disabled={isPending}
            >
              Regen token
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openPreview(props.initialValues.slug, previewToken)
              }
              disabled={isPending || !previewToken}
            >
              Preview
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {props.mode === 'create' ? 'Create post' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

// Opens the web preview URL in a new tab. NEXT_PUBLIC_WEB_URL is baked
// at build time; missing env falls back to localhost:3000 so it works in
// local dev without extra config. The preview URL includes the token so
// unpublished drafts render; the token stays with the URL and doesn't
// need to travel through a session or cookie. Called with the LIVE token
// (may differ from initialValues.previewToken after a regen click) so
// the newly-opened tab always uses the current token.
function openPreview(slug: string, token: string): void {
  if (!token) return
  const base =
    process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  const url = `${base}/blog/preview/${slug}?token=${encodeURIComponent(token)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Normalizes an optional-locale form value into a LocalizedString (with
// required `en`) or undefined. If nothing is filled in, we send nothing —
// keeps the server-side "meta unset → fall back to title" logic clean.
// If only DE/HR are filled but not EN, we still return undefined because
// the type requires en.
function toLocalizedOrUndefined(
  v: { en?: string; de?: string; hr?: string } | undefined,
): { en: string; de?: string; hr?: string } | undefined {
  const en = v?.en?.trim()
  const de = v?.de?.trim()
  const hr = v?.hr?.trim()
  if (!en && !de && !hr) return undefined
  if (!en) return undefined
  return {
    en,
    ...(de ? { de } : {}),
    ...(hr ? { hr } : {}),
  }
}
