'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type {
  AdminCreateExcursionRequest,
  AdminExcursion,
  AdminUpdateExcursionRequest,
} from '@guide-me-app/core'
import {
  createExcursionAction,
  updateExcursionAction,
} from '@/actions/excursions'
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
import { SingleImageInput } from '@/components/forms/single-image-input'
import { Plus, Trash2 } from 'lucide-react'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const localizedSchema = z.object({
  en: z.string().min(1, 'English is required'),
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

const stopSchema = z.object({
  slug: z.string().regex(SLUG_REGEX),
  order: z.coerce.number().int().min(0),
  name: localizedSchema,
  description: localizedSchema,
  coords: latLngSchema,
  image: z.string().url(),
  images: z.array(z.string().url()).optional(),
  audioUrl: localizedAudioSchema.optional(),
})

const poiSchema = z.object({
  slug: z.string().regex(SLUG_REGEX),
  order: z.coerce.number().int().min(0),
  name: localizedSchema,
  category: z.enum(['restaurant', 'bar', 'shopping']),
  description: localizedSchema,
  coords: latLngSchema,
  image: z.string().url(),
  images: z.array(z.string().url()).optional(),
})

const baseSchema = {
  citySlug: z.string().regex(SLUG_REGEX),
  name: localizedSchema,
  meta: localizedSchema,
  image: z.string().url(),
  stops: z.array(stopSchema),
  pois: z.array(poiSchema).optional(),
  isEnabled: z.boolean(),
}

const createSchema = z.object({ slug: z.string().regex(SLUG_REGEX), ...baseSchema })
const updateSchema = z.object(baseSchema)
type CreateValues = z.infer<typeof createSchema>

type Props =
  | { mode: 'create'; cities: { slug: string; name: string }[]; initialValues?: undefined }
  | { mode: 'edit'; cities: { slug: string; name: string }[]; initialValues: AdminExcursion }

export function ExcursionForm(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = props.mode === 'edit'

  const defaultValues: CreateValues = isEdit
    ? {
        slug: props.initialValues.slug,
        citySlug: props.initialValues.citySlug,
        name: props.initialValues.name,
        meta: props.initialValues.meta,
        image: props.initialValues.image,
        stops: props.initialValues.stops,
        pois: props.initialValues.pois ?? [],
        isEnabled: props.initialValues.isEnabled,
      }
    : {
        slug: '',
        citySlug: props.cities[0]?.slug ?? '',
        name: { en: '' },
        meta: { en: '' },
        image: '',
        stops: [],
        pois: [],
        isEnabled: true,
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues,
  })

  const stops = useFieldArray({ control: form.control, name: 'stops' })
  const pois = useFieldArray({ control: form.control, name: 'pois' })

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = stripEmpties(raw)
      const res = isEdit
        ? await updateExcursionAction(
            props.initialValues!.slug,
            cleaned as AdminUpdateExcursionRequest,
          )
        : await createExcursionAction(cleaned as AdminCreateExcursionRequest)
      if (!res.ok) {
        toast.error('Save failed', { description: res.error })
        return
      }
      toast.success(isEdit ? 'Excursion updated' : 'Excursion created')
      router.push('/discover/excursions')
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-3xl">
      {!isEdit && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-2">
            <Label htmlFor="slug">
              Slug<span className="text-[var(--color-destructive)] ml-1">*</span>
            </Label>
            <Input id="slug" {...form.register('slug')} placeholder="belem" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
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
          <SingleImageInput
            control={form.control}
            name="image"
            label="Hero image"
            required
            folder={`excursion/${isEdit ? props.initialValues!.slug : form.watch('slug') || 'untitled'}`}
          />
          <LocalizedInput control={form.control} name="name" label="Name" required />
          <LocalizedInput
            control={form.control}
            name="meta"
            label="Meta"
            placeholder="3h · €35"
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Stops ({stops.fields.length})</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                stops.append({
                  slug: '',
                  order: stops.fields.length,
                  name: { en: '' },
                  description: { en: '' },
                  coords: { latitude: 0, longitude: 0 },
                  image: '',
                  images: [],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add stop
            </Button>
          </div>
          {stops.fields.map((field, idx) => (
            <Card key={field.id} className="border-dashed">
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-[var(--color-muted-foreground)]">
                    Stop {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => stops.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Slug</Label>
                    <Input {...form.register(`stops.${idx}.slug`)} placeholder="jeronimos" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Order</Label>
                    <Input
                      type="number"
                      {...form.register(`stops.${idx}.order`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      {...form.register(`stops.${idx}.coords.latitude`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      {...form.register(`stops.${idx}.coords.longitude`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
                <SingleImageInput
                  control={form.control}
                  name={`stops.${idx}.image`}
                  label="Hero image"
                  required
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}`}
                />
                <LocalizedInput
                  control={form.control}
                  name={`stops.${idx}.name`}
                  label="Name"
                  required
                />
                <LocalizedInput
                  control={form.control}
                  name={`stops.${idx}.description`}
                  label="Description"
                  required
                  multiline
                />
                <ImageListInput
                  control={form.control}
                  name={`stops.${idx}.images`}
                  label="Gallery images"
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}/gallery`}
                />
                <AudioInput
                  control={form.control}
                  name={`stops.${idx}.audioUrl`}
                  label="Audio guide"
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}`}
                />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">POIs ({pois.fields.length})</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                pois.append({
                  slug: '',
                  order: pois.fields.length,
                  name: { en: '' },
                  category: 'restaurant',
                  description: { en: '' },
                  coords: { latitude: 0, longitude: 0 },
                  image: '',
                  images: [],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add POI
            </Button>
          </div>
          {pois.fields.map((field, idx) => (
            <Card key={field.id} className="border-dashed">
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-[var(--color-muted-foreground)]">
                    POI {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => pois.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Slug</Label>
                    <Input {...form.register(`pois.${idx}.slug`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Order</Label>
                    <Input
                      type="number"
                      {...form.register(`pois.${idx}.order`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={form.watch(`pois.${idx}.category`)}
                      onValueChange={(v) =>
                        form.setValue(`pois.${idx}.category`, v as never)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      {...form.register(`pois.${idx}.coords.latitude`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      {...form.register(`pois.${idx}.coords.longitude`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
                <SingleImageInput
                  control={form.control}
                  name={`pois.${idx}.image`}
                  label="Hero image"
                  required
                  folder={`excursion/${form.watch('slug') || 'untitled'}/pois/${form.watch(`pois.${idx}.slug`) || `poi-${idx}`}`}
                />
                <LocalizedInput
                  control={form.control}
                  name={`pois.${idx}.name`}
                  label="Name"
                  required
                />
                <LocalizedInput
                  control={form.control}
                  name={`pois.${idx}.description`}
                  label="Description"
                  required
                  multiline
                />
                <ImageListInput
                  control={form.control}
                  name={`pois.${idx}.images`}
                  label="Gallery images"
                  folder={`excursion/${form.watch('slug') || 'untitled'}/pois/${form.watch(`pois.${idx}.slug`) || `poi-${idx}`}/gallery`}
                />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Visible to mobile</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Disabled excursions are hidden from the public app.
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
          onClick={() => router.push('/discover/excursions')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create excursion'}
        </Button>
      </div>
    </form>
  )
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
