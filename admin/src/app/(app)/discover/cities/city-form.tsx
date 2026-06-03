'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type {
  AdminCity,
  AdminCreateCityRequest,
  AdminUpdateCityRequest,
} from '@guide-me-app/core'
import { createCityAction, updateCityAction } from '@/actions/cities'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AudioInput } from '@/components/forms/audio-input'
import { LocalizedInput } from '@/components/forms/localized-input'
import { PlacePicker } from '@/components/forms/place-picker'
import { SingleImageInput } from '@/components/forms/single-image-input'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const localizedSchema = z.object({
  en: z.string().min(1, 'English is required'),
  de: z.string().optional(),
  hr: z.string().optional(),
})

const localizedAudioSchema = z.object({
  en: z.string().url().optional(),
  de: z.string().url().optional(),
  hr: z.string().url().optional(),
})

const editorPickPartialSchema = z
  .object({
    headline: z
      .object({
        en: z.string().optional(),
        de: z.string().optional(),
        hr: z.string().optional(),
      })
      .optional(),
    tagline: z
      .object({
        en: z.string().optional(),
        de: z.string().optional(),
        hr: z.string().optional(),
      })
      .optional(),
  })
  .optional()
  .refine(
    (val) => {
      if (!val) return true
      const hasHeadline = !!val.headline?.en?.trim()
      const hasTagline = !!val.tagline?.en?.trim()
      return hasHeadline === hasTagline
    },
    {
      message: 'Fill both headline and tagline, or leave both empty',
      path: ['headline', 'en'],
    },
  )

const baseSchema = {
  image: z.string().url('Must be a valid URL'),
  name: localizedSchema,
  country: localizedSchema,
  editorPick: editorPickPartialSchema,
  audioUrl: localizedAudioSchema.optional(),
  cityPlaceSlugs: z.array(z.string().regex(SLUG_REGEX)).optional(),
  isEnabled: z.boolean(),
}

const createSchema = z.object({
  slug: z.string().regex(SLUG_REGEX, 'Lowercase letters, numbers, hyphens only'),
  ...baseSchema,
})

const updateSchema = z.object(baseSchema)

type CreateValues = z.infer<typeof createSchema>
type UpdateValues = z.infer<typeof updateSchema>

type Props =
  | { mode: 'create'; initialValues?: undefined }
  | { mode: 'edit'; initialValues: AdminCity }

export function CityForm(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = props.mode === 'edit'

  const defaultValues: CreateValues | UpdateValues = isEdit
    ? {
        image: props.initialValues.image,
        name: props.initialValues.name,
        country: props.initialValues.country,
        editorPick: props.initialValues.editorPick,
        audioUrl: props.initialValues.audioUrl,
        cityPlaceSlugs: props.initialValues.cityPlaceSlugs ?? [],
        isEnabled: props.initialValues.isEnabled,
      }
    : {
        slug: '',
        image: '',
        name: { en: '' },
        country: { en: '' },
        editorPick: undefined,
        audioUrl: undefined,
        cityPlaceSlugs: [],
        isEnabled: true,
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues: defaultValues as CreateValues,
  })

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = normalizePayload(raw)
      const res = isEdit
        ? await updateCityAction(props.initialValues!.slug, cleaned as AdminUpdateCityRequest)
        : await createCityAction(cleaned as AdminCreateCityRequest)
      if (!res.ok) {
        toast.error('Save failed', { description: res.error })
        return
      }
      toast.success(isEdit ? 'City updated' : 'City created')
      router.push('/discover/cities')
    })
  }

  // On the create form we don't know the city's own slug yet — the user is
  // typing it. The picker also needs that slug to fetch places by city.
  // Solution: only render the picker in edit mode.
  const citySlug = isEdit ? props.initialValues.slug : ''

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      {!isEdit && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-2">
            <Label htmlFor="slug">
              Slug<span className="text-[var(--color-destructive)] ml-1">*</span>
            </Label>
            <Input id="slug" {...form.register('slug')} placeholder="lisbon" />
            {form.formState.errors.slug?.message && (
              <p className="text-xs text-[var(--color-destructive)]">
                {form.formState.errors.slug.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <SingleImageInput
            control={form.control}
            name="image"
            label="Image"
            required
            folder={`city/${isEdit ? props.initialValues!.slug : form.watch('slug') || 'untitled'}`}
          />
          <LocalizedInput control={form.control} name="name" label="Name" required />
          <LocalizedInput control={form.control} name="country" label="Country" required />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <p className="text-sm font-medium">Editor's pick (optional)</p>
          <LocalizedInput
            control={form.control}
            name="editorPick.headline"
            label="Headline"
            placeholder="Editor's pick"
          />
          <LocalizedInput
            control={form.control}
            name="editorPick.tagline"
            label="Tagline"
            multiline
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <AudioInput
            control={form.control}
            name="audioUrl"
            label="City intro audio (optional)"
            folder={`city/${isEdit ? props.initialValues!.slug : form.watch('slug') || 'untitled'}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <PlacePicker
            citySlug={citySlug}
            value={form.watch('cityPlaceSlugs') ?? []}
            onChange={(next) =>
              form.setValue('cityPlaceSlugs', next, { shouldDirty: true })
            }
            label="Places to show in this city"
            emptyHint="Save the city first, then come back to attach places."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Visible to mobile</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Disabled cities are hidden from the public app.
            </p>
          </div>
          <Switch
            checked={form.watch('isEnabled')}
            onCheckedChange={(v) => form.setValue('isEnabled', v)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/discover/cities')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create city'}
        </Button>
      </div>
    </form>
  )
}

// Drops blank optional fields before submit. editorPick requires both
// headline.en and tagline.en on the api, so we drop the whole block unless
// both are present.
function normalizePayload(raw: CreateValues): CreateValues {
  const out: Record<string, unknown> = { ...raw }
  const ep = raw.editorPick as
    | { headline?: { en?: string }; tagline?: { en?: string } }
    | undefined
  const headlineEn = ep?.headline?.en?.trim()
  const taglineEn = ep?.tagline?.en?.trim()
  if (!headlineEn || !taglineEn) {
    delete out.editorPick
  } else {
    out.editorPick = stripEmptyStrings(raw.editorPick)
  }

  // Drop audioUrl if no locale has a URL.
  const audio = raw.audioUrl as Record<string, unknown> | undefined
  if (!audio || Object.values(audio).every((v) => !v)) {
    delete out.audioUrl
  } else {
    out.audioUrl = stripEmptyStrings(raw.audioUrl)
  }

  return out as CreateValues
}

function stripEmptyStrings<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripEmptyStrings) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === '' || v === undefined) continue
      out[k] = stripEmptyStrings(v)
    }
    return out as T
  }
  return value
}
