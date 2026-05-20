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
import { ImageInput } from '@/components/forms/image-input'
import { LocalizedInput } from '@/components/forms/localized-input'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const localizedSchema = z.object({
  en: z.string().min(1, 'English is required'),
  de: z.string().optional(),
  hr: z.string().optional(),
})

const baseSchema = {
  citySlug: z.string().regex(SLUG_REGEX),
  category: z.enum(['restaurant', 'bar', 'shopping']),
  name: localizedSchema,
  meta: localizedSchema,
  image: z.string().url(),
  description: localizedSchema.optional(),
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
        isEnabled: true,
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues,
  })

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = stripEmpties(raw)
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
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ImageInput control={form.control} name="image" label="Image URL" required />
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
            name="description"
            label="Description (optional)"
            multiline
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
