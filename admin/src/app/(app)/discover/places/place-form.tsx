'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type {
  AdminCreatePlaceRequest,
  AdminPlace,
  AdminUpdatePlaceRequest,
} from '@guide-me-app/core'
import { createPlaceAction, updatePlaceAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AudioInput } from '@/components/forms/audio-input'
import { ImageListInput } from '@/components/forms/image-list-input'
import { LocalizedInput } from '@/components/forms/localized-input'
import { MapCoordsPicker } from '@/components/forms/map-coords-picker'
import { SingleImageInput } from '@/components/forms/single-image-input'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const CATEGORIES = [
  'restaurant',
  'cafe',
  'bar',
  'shopping',
  'event',
  'park',
] as const

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  shopping: 'Shopping',
  event: 'Event',
  park: 'Park',
}

const localizedSchema = z.object({
  en: z.string().min(1, 'English is required'),
  de: z.string().optional(),
  hr: z.string().optional(),
})

// Sub-category is fully optional — none of the three locales is required —
// and editors may type free-form labels like "Japanese" or "Pizza". Falsy en
// drops the whole field at submit time so we don't store empty objects.
const optionalLocalizedSchema = z.object({
  en: z.string().optional(),
  de: z.string().optional(),
  hr: z.string().optional(),
})

const latLngSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
})

const localizedAudioSchema = z.object({
  en: z.string().url().optional(),
  de: z.string().url().optional(),
  hr: z.string().url().optional(),
})

const baseSchema = {
  citySlug: z.string().regex(SLUG_REGEX),
  category: z.enum(CATEGORIES),
  name: localizedSchema,
  meta: localizedSchema,
  image: z.string().url(),
  description: localizedSchema.optional(),
  images: z.array(z.string().url()).optional(),
  coords: latLngSchema.optional(),
  subCategory: optionalLocalizedSchema.optional(),
  audioUrl: localizedAudioSchema.optional(),
  isEnabled: z.boolean(),
}

const createSchema = z.object({ slug: z.string().regex(SLUG_REGEX), ...baseSchema })
const updateSchema = z.object(baseSchema)

type CreateValues = z.infer<typeof createSchema>

type Props =
  | { mode: 'create'; cities: { slug: string; name: string }[]; initialValues?: undefined }
  | { mode: 'edit'; cities: { slug: string; name: string }[]; initialValues: AdminPlace }

export function PlaceForm(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = props.mode === 'edit'

  const defaultValues: CreateValues = isEdit
    ? {
        slug: props.initialValues.slug,
        citySlug: props.initialValues.citySlug,
        category: props.initialValues.category,
        name: props.initialValues.name,
        meta: props.initialValues.meta,
        image: props.initialValues.image,
        description: props.initialValues.description,
        images: props.initialValues.images,
        coords: props.initialValues.coords,
        subCategory: props.initialValues.subCategory,
        audioUrl: props.initialValues.audioUrl,
        isEnabled: props.initialValues.isEnabled,
      }
    : {
        slug: '',
        citySlug: props.cities[0]?.slug ?? '',
        category: 'restaurant',
        name: { en: '' },
        meta: { en: '' },
        image: '',
        description: undefined,
        images: undefined,
        coords: undefined,
        subCategory: undefined,
        audioUrl: undefined,
        isEnabled: true,
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues,
  })

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = normalizePayload(raw)
      const res = isEdit
        ? await updatePlaceAction(
            props.initialValues!.slug,
            cleaned as AdminUpdatePlaceRequest,
          )
        : await createPlaceAction(cleaned as AdminCreatePlaceRequest)
      if (!res.ok) {
        toast.error('Save failed', { description: res.error })
        return
      }
      toast.success(isEdit ? 'Place updated' : 'Place created')
      router.push('/discover/places')
    })
  }

  // Reused for image/audio folder paths.
  const slugForFolder = isEdit ? props.initialValues!.slug : form.watch('slug') || 'untitled'

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      {!isEdit && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-2">
            <Label htmlFor="slug">
              Slug<span className="text-[var(--color-destructive)] ml-1">*</span>
            </Label>
            <Input id="slug" {...form.register('slug')} placeholder="time-out-market" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>City</Label>
              <Select
                value={form.watch('citySlug')}
                onValueChange={(v) => form.setValue('citySlug', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {props.cities.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => form.setValue('category', v as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SingleImageInput
            control={form.control}
            name="image"
            label="Hero image"
            required
            folder={`place/${slugForFolder}`}
          />
          <LocalizedInput control={form.control} name="name" label="Name" required />
          <LocalizedInput
            control={form.control}
            name="meta"
            label="Meta"
            placeholder="Seafood · €€€"
            required
          />
          <LocalizedInput
            control={form.control}
            name="subCategory"
            label="Sub-category (optional)"
            placeholder="Japanese, Pizza, Recommended…"
          />
          <LocalizedInput
            control={form.control}
            name="description"
            label="Description (optional)"
            multiline
          />
          <ImageListInput
            control={form.control}
            name="images"
            label="Gallery images"
            folder={`place/${slugForFolder}/gallery`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <p className="text-sm font-medium">Location (optional)</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Required for the place to appear on the mobile map. Click on the map
            or type coordinates manually.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="any"
                {...form.register('coords.latitude', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="any"
                {...form.register('coords.longitude', { valueAsNumber: true })}
              />
            </div>
          </div>
          <MapCoordsPicker
            latitude={form.watch('coords.latitude') ?? 0}
            longitude={form.watch('coords.longitude') ?? 0}
            onChange={({ latitude, longitude }) => {
              form.setValue('coords.latitude', latitude, { shouldDirty: true })
              form.setValue('coords.longitude', longitude, { shouldDirty: true })
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <AudioInput
            control={form.control}
            name="audioUrl"
            label="Audio guide (optional)"
            folder={`place/${slugForFolder}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Visible to mobile</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Disabled places are hidden from the public app.
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
          onClick={() => router.push('/discover/places')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create place'}
        </Button>
      </div>
    </form>
  )
}

// Drops empty optional fields and untouched LocalizedString blocks so the api
// doesn't store {en: ''} for sub-category etc.
function normalizePayload(raw: CreateValues): CreateValues {
  const out = stripEmpties(raw) as Record<string, unknown>

  // sub-category: if en is missing/blank, drop the whole field.
  const sub = out.subCategory as Record<string, unknown> | undefined
  if (!sub || typeof sub !== 'object' || !sub.en) {
    delete out.subCategory
  }

  // coords: both lat and lng must be present to be meaningful.
  const coords = out.coords as { latitude?: number; longitude?: number } | undefined
  if (
    !coords ||
    typeof coords.latitude !== 'number' ||
    typeof coords.longitude !== 'number' ||
    Number.isNaN(coords.latitude) ||
    Number.isNaN(coords.longitude)
  ) {
    delete out.coords
  }

  // audio: if no locale has a url, drop it.
  const audio = out.audioUrl as Record<string, unknown> | undefined
  if (audio && Object.values(audio).every((v) => !v)) {
    delete out.audioUrl
  }

  return out as CreateValues
}

function stripEmpties<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripEmpties) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === '' || v === undefined) continue
      out[k] = stripEmpties(v)
    }
    return out as T
  }
  return value
}
