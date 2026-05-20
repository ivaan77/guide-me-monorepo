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
import { ImageInput } from '@/components/forms/image-input'
import { LocalizedInput } from '@/components/forms/localized-input'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const localizedSchema = z.object({
  en: z.string().min(1, 'English is required'),
  de: z.string().optional(),
  hr: z.string().optional(),
})

const editorPickSchema = z
  .object({
    headline: localizedSchema,
    tagline: localizedSchema,
  })
  .optional()

const baseSchema = {
  image: z.string().url('Must be a valid URL'),
  name: localizedSchema,
  country: localizedSchema,
  editorPick: editorPickSchema,
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
        isEnabled: props.initialValues.isEnabled,
      }
    : {
        slug: '',
        image: '',
        name: { en: '' },
        country: { en: '' },
        editorPick: undefined,
        isEnabled: true,
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues: defaultValues as CreateValues,
  })

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = stripEmpties(raw)
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
          <ImageInput control={form.control} name="image" label="Image URL" required />
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

// Strips empty-string values from LocalizedString sub-objects and the optional
// editorPick to keep payloads clean. The api validates strictly.
function stripEmpties<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripEmpties) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === '' || v === undefined) continue
      const cleaned = stripEmpties(v)
      // editorPick: drop entirely if both headline.en and tagline.en are blank
      out[k] = cleaned
    }
    if (
      'headline' in out === false &&
      'tagline' in out === false &&
      Object.keys(out).length === 0
    ) {
      return undefined as unknown as T
    }
    return out as T
  }
  return value
}
