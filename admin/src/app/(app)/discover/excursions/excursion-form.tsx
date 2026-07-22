'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type {
  AdminCreateExcursionRequest,
  AdminDraftEntry,
  AdminExcursion,
  AdminUpdateExcursionRequest,
} from '@guide-me-app/core'
import {
  createExcursionAction,
  updateExcursionAction,
} from '@/actions/excursions'
import { deleteDraftAction } from '@/actions/drafts'
import { DraftBadge } from '@/components/forms/draft-badge'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
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
import { FieldHint } from '@/components/forms/field-hint'
import { ImageListInput } from '@/components/forms/image-list-input'
import { LocalizedInput } from '@/components/forms/localized-input'
import { MapCoordsPicker } from '@/components/forms/map-coords-picker'
import { ExcursionFormFloatingNav } from '@/components/forms/excursion-form-floating-nav'
import { PlacePicker } from '@/components/forms/place-picker'
import { SingleImageInput } from '@/components/forms/single-image-input'
import { buildUniqueSlug, slugify } from '@/lib/slug'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

// Mirrors the mobile-side fallback for both stop arrival and geocoded facts
// (see mobile/screens/excursion/ExcursionScreen.tsx and FloatingFactBanner.tsx).
// Used only for the visual radius circle in the picker — the stored form
// value can still be empty, which triggers this same default at runtime.
const DEFAULT_TRIGGER_RADIUS_M = 30

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

// react-hook-form returns NaN for an empty <input type="number"> when
// valueAsNumber is set, which would fail .int().min(1). Preprocess to drop
// NaN / null / '' down to undefined so .optional() actually kicks in.
const optionalPositiveInt = z.preprocess((v) => {
  if (v === '' || v == null) return undefined
  if (typeof v === 'number' && Number.isNaN(v)) return undefined
  return v
}, z.coerce.number().int().min(1).optional())

// Sub-stops live inside a parent stop. They inherit the parent's
// triggerRadius (arrival is detected on the parent), but each has its own
// coords so the dots on the map land at real locations. Array order =
// display order; editors reorder via the up/down arrow controls inside
// the editor.
const subStopSchema = z.object({
  slug: z.string().regex(SLUG_REGEX),
  name: localizedSchema,
  description: localizedSchema,
  coords: latLngSchema,
  image: z.string().url(),
  images: z.array(z.string().url()).optional(),
  audioUrl: localizedAudioSchema.optional(),
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
  triggerRadius: optionalPositiveInt,
  subStops: z.array(subStopSchema).optional(),
})

// Excursion POIs are references into the places collection. Order is
// per-excursion so the same place can sit in different positions in
// different routes.
const poiRefSchema = z.object({
  placeSlug: z.string().regex(SLUG_REGEX),
  order: z.coerce.number().int().min(0),
})

// Optional geocoded trigger: when coords are set, mobile fires the fact
// the moment the user enters the radius (default 30m). Both lat and lng
// must be valid numbers OR both must be blank (in which case coords is
// stripped out of the payload). Preprocess turns NaN/empty into undefined
// so a half-filled pair doesn't fail validation outright; the
// normalizePayload step handles the strip-when-blank case.
const optionalLatLngSchema = z
  .object({
    latitude: z.preprocess(
      (v) =>
        v === '' || v == null || (typeof v === 'number' && Number.isNaN(v))
          ? undefined
          : v,
      z.coerce.number().min(-90).max(90).optional(),
    ),
    longitude: z.preprocess(
      (v) =>
        v === '' || v == null || (typeof v === 'number' && Number.isNaN(v))
          ? undefined
          : v,
      z.coerce.number().min(-180).max(180).optional(),
    ),
  })
  .optional()

const interestingFactSchema = z.object({
  slug: z.string().regex(SLUG_REGEX),
  title: localizedSchema,
  audioUrl: z.object({
    en: z.string().url().optional(),
    de: z.string().url().optional(),
    hr: z.string().url().optional(),
  }),
  coords: optionalLatLngSchema,
  triggerRadius: optionalPositiveInt,
})

// Optional sign-off card shown after the last stop. Required fields
// (title, description, image) become required only when the editor has
// enabled the outro — handled by the enabled flag check inside the
// onSubmit path so editors who don't author one don't see false errors.
const outroSchema = z.object({
  title: localizedSchema,
  description: localizedSchema,
  image: z.string().url(),
  images: z.array(z.string().url()).optional(),
  audioUrl: localizedAudioSchema.optional(),
})

const baseSchema = {
  citySlug: z.string().regex(SLUG_REGEX),
  name: localizedSchema,
  meta: localizedSchema,
  image: z.string().url(),
  stops: z.array(stopSchema),
  pois: z.array(poiRefSchema).optional(),
  interestingFacts: z.array(interestingFactSchema).optional(),
  outro: outroSchema.optional(),
  // Companion flag for the form only — toggles whether the outro is
  // submitted. Stripped from the payload in normalizePayload. Lets editors
  // disable the outro without wiping authored content.
  outroEnabled: z.boolean(),
  isEnabled: z.boolean(),
  // Required. Drives the mobile "check the forecast" recommendation on
  // ExcursionScreen preview. See PublicExcursion.weatherSensitivity for
  // the semantics of each value.
  weatherSensitivity: z.enum(['outdoor', 'mixed', 'indoor']),
}

const createSchema = z.object({ slug: z.string().regex(SLUG_REGEX), ...baseSchema })
const updateSchema = z.object(baseSchema)
type CreateValues = z.infer<typeof createSchema>

type Props =
  | {
      mode: 'create'
      cities: { slug: string; name: string }[]
      // Existing excursion slugs so the auto-generated slug can avoid
      // collisions (belem → belem-2).
      existingSlugs?: string[]
      initialValues?: undefined
      // Optional autosaved draft (passed by /new?draft=<slug>). When set,
      // its payload becomes the form's initial state so the user picks
      // up exactly where they left off.
      initialDraft?: AdminDraftEntry | null
    }
  | {
      mode: 'edit'
      cities: { slug: string; name: string }[]
      initialValues: AdminExcursion
      // Autosaved draft for this slug, if any. Surfaced as an in-page
      // banner so the user can choose whether to restore or discard.
      // Never applied automatically in edit mode — the saved entity is
      // authoritative until the user opts in.
      initialDraft?: AdminDraftEntry | null
    }

export function ExcursionForm(props: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = props.mode === 'edit'

  // In create mode, if we arrived via the "resume draft" flow, use the
  // draft's payload as the form's starting values. In edit mode we
  // ignore the draft here — the user has to opt in via the banner
  // (see draftBanner below) so we never silently override saved data.
  const createDraftPayload =
    !isEdit && props.initialDraft
      ? (props.initialDraft.payload as CreateValues | undefined)
      : undefined

  const defaultValues: CreateValues = isEdit
    ? {
        slug: props.initialValues.slug,
        citySlug: props.initialValues.citySlug,
        name: props.initialValues.name,
        meta: props.initialValues.meta,
        image: props.initialValues.image,
        // Pre-sort by order so reopening an excursion shows stops/POIs in
        // the same sequence the user last saved. Without this, the form
        // would render in raw mongo array order, which may diverge after a
        // reorder save (though saving renumbers them, defensive sort here
        // protects against any other source of out-of-order data).
        stops: [...props.initialValues.stops].sort(
          (a, b) => a.order - b.order,
        ),
        pois: [...(props.initialValues.pois ?? [])].sort(
          (a, b) => a.order - b.order,
        ),
        interestingFacts: props.initialValues.interestingFacts ?? [],
        outro: props.initialValues.outro,
        outroEnabled: !!props.initialValues.outro,
        isEnabled: props.initialValues.isEnabled,
        // Fallback shouldn't fire (backfill script sets this on every doc)
        // but keeps the form robust if a doc slips through.
        weatherSensitivity: props.initialValues.weatherSensitivity ?? 'outdoor',
      }
    : createDraftPayload ?? {
        slug: '',
        citySlug: props.cities[0]?.slug ?? '',
        name: { en: '' },
        meta: { en: '' },
        image: '',
        stops: [],
        pois: [],
        interestingFacts: [],
        outro: undefined,
        outroEnabled: false,
        isEnabled: true,
        weatherSensitivity: 'outdoor',
      }

  const form = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as never,
    defaultValues,
  })

  // Autosave: subscribes to form.watch, debounces 2s, PUTs to the drafts
  // endpoint keyed by slug. In create mode we set defaultValues from the
  // draft (if any) but ALSO mark the form dirty so autosave fires again
  // on next edit — this preserves the same slug's draft as the user
  // continues typing.
  const currentSlug = form.watch('slug') ?? ''
  const {
    status: draftStatus,
    clearDraft,
    markSaved: markDraftSaved,
  } = useDraftAutosave<CreateValues>({
    entityType: 'excursion',
    slug: currentSlug,
    isNew: !isEdit,
    form,
  })

  // Edit-mode "load draft" banner. Visible only if:
  //  - we're in edit mode
  //  - a draft exists for this slug
  //  - the user hasn't yet chosen (load or discard)
  const [editDraftBannerState, setEditDraftBannerState] = useState<
    'visible' | 'dismissed'
  >(isEdit && props.initialDraft ? 'visible' : 'dismissed')
  const restoreEditDraft = () => {
    if (!props.initialDraft) return
    const payload = props.initialDraft.payload as CreateValues
    form.reset(payload, {
      // Keep the form marked dirty so the autosave hook fires again as
      // soon as the user edits anything post-restore.
      keepDirty: true,
    })
    setEditDraftBannerState('dismissed')
    // Two-step cleanup: delete the server-side draft AND mark this
    // exact snapshot as "already saved" locally. Without markDraftSaved,
    // the watch echo from reset() would fire a redundant autosave 2s
    // later, recreating the very draft we just deleted. If the user
    // subsequently edits anything, that legitimately produces a new
    // snapshot and autosaves fresh.
    markDraftSaved(payload)
    void clearDraft()
    toast.success('Draft restored')
  }
  const discardEditDraft = async () => {
    setEditDraftBannerState('dismissed')
    await clearDraft()
    toast.success('Draft discarded')
  }

  const stops = useFieldArray({ control: form.control, name: 'stops' })
  const facts = useFieldArray({ control: form.control, name: 'interestingFacts' })

  const citySlug = form.watch('citySlug')
  const pois = form.watch('pois') ?? []

  // Top-level slug auto-derived from name.en on create. Read-only field.
  // Skipped in edit mode (slug is immutable post-save).
  const existingSlugs = !isEdit ? props.existingSlugs ?? [] : []
  const watchedNameEn = form.watch('name.en')
  useEffect(() => {
    if (isEdit) return
    const base = slugify(watchedNameEn ?? '')
    const next = buildUniqueSlug(base, existingSlugs)
    form.setValue('slug', next, { shouldValidate: !!next })
  }, [watchedNameEn, isEdit, form, existingSlugs])

  // Auto-derive each stop's slug from its name.en. Uniqueness is local to
  // this excursion's stops array so two stops in the same excursion can't
  // collide (visible slug is just a routing key inside the embedded array).
  const watchedStopNames = stops.fields
    .map((_, idx) => form.watch(`stops.${idx}.name.en`) ?? '')
    .join('|')

  // Options for the floating "Jump to stop" select. Built off the same
  // watched names so editing a name updates the dropdown live. Falls back
  // to "Stop N" when the name is empty (newly added stops).
  const stopJumpOptions = stops.fields.map((_, idx) => {
    const nameEn = form.watch(`stops.${idx}.name.en`) ?? ''
    return {
      id: `stop-card-${idx}`,
      label: `${idx + 1}. ${nameEn || `Stop ${idx + 1}`}`,
    }
  })
  useEffect(() => {
    const taken = new Set<string>()
    stops.fields.forEach((_, idx) => {
      const nameEn = form.watch(`stops.${idx}.name.en`) ?? ''
      const base = slugify(nameEn) || `stop-${idx + 1}`
      const unique = buildUniqueSlug(base, taken)
      taken.add(unique)
      if (form.getValues(`stops.${idx}.slug`) !== unique) {
        form.setValue(`stops.${idx}.slug`, unique, { shouldValidate: true })
      }
    })
    // We deliberately depend on the joined names string so we only re-run
    // when an actual name field changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStopNames, stops.fields.length])

  // Same treatment for interesting fact slugs, derived from title.en.
  const watchedFactTitles = facts.fields
    .map((_, idx) => form.watch(`interestingFacts.${idx}.title.en`) ?? '')
    .join('|')
  useEffect(() => {
    const taken = new Set<string>()
    facts.fields.forEach((_, idx) => {
      const titleEn = form.watch(`interestingFacts.${idx}.title.en`) ?? ''
      const base = slugify(titleEn) || `fact-${idx + 1}`
      const unique = buildUniqueSlug(base, taken)
      taken.add(unique)
      if (form.getValues(`interestingFacts.${idx}.slug`) !== unique) {
        form.setValue(`interestingFacts.${idx}.slug`, unique, {
          shouldValidate: true,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFactTitles, facts.fields.length])

  const onSubmit = (raw: CreateValues) => {
    startTransition(async () => {
      const cleaned = normalizePayload(raw)
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
      // Real save landed — drop the autosaved draft for this slug so it
      // doesn't linger as a phantom "unsaved changes" entry. Best-effort:
      // TTL will clean up if the delete fails (see clearDraft in the
      // autosave hook).
      const finalSlug = isEdit ? props.initialValues!.slug : raw.slug
      if (finalSlug) {
        try {
          await deleteDraftAction('excursion', finalSlug)
        } catch {
          // non-fatal
        }
      }
      toast.success(isEdit ? 'Excursion updated' : 'Excursion created')
      router.push('/discover/excursions')
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-3xl">
      <ExcursionFormFloatingNav stops={stopJumpOptions} />
      {isEdit && editDraftBannerState === 'visible' && props.initialDraft && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="flex-1 min-w-[16rem] text-sm text-amber-900">
            You have unsaved changes from{' '}
            <time
              dateTime={props.initialDraft.updatedAt}
              className="font-medium"
            >
              {new Date(props.initialDraft.updatedAt).toLocaleString()}
            </time>
            . Restore them or keep working from the saved version.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void discardEditDraft()}
            >
              Discard draft
            </Button>
            <Button type="button" size="sm" onClick={restoreEditDraft}>
              Load draft
            </Button>
          </div>
        </div>
      )}
      {!isEdit && (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-2">
            <Label htmlFor="slug">Slug (auto-generated)</Label>
            <Input
              id="slug"
              value={form.watch('slug') ?? ''}
              readOnly
              placeholder="Will fill in once you start typing the name"
              className="font-mono text-sm bg-[var(--color-muted)]"
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Derived from the English name. Can't be changed after save.
            </p>
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
            hint="Shown as the excursion card on the city detail screen and at the top of the favorites row."
            folder={`excursion/${isEdit ? props.initialValues!.slug : form.watch('slug') || 'untitled'}`}
          />
          <LocalizedInput
            control={form.control}
            name="name"
            label="Name"
            required
            hint="Title of the excursion in lists and at the top of the excursion screen."
          />
          <LocalizedInput
            control={form.control}
            name="meta"
            label="Meta"
            placeholder="3h · €35"
            required
            hint="Short line under the excursion name. Conventionally duration + price (e.g. '3h · €35')."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Stops ({stops.fields.length})</p>
            <FieldHint text="Each stop becomes a numbered marker on the excursion map and a row in the bottom navigation list. The user is guided to each stop in order during the route." />
          </div>
          {stops.fields.map((field, idx) => (
            <Card
              key={field.id}
              id={`stop-card-${idx}`}
              className="border-dashed"
            >
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
                    <Label className="text-xs">Order</Label>
                    <Input
                      type="number"
                      {...form.register(`stops.${idx}.order`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Trigger radius (m)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      {...form.register(`stops.${idx}.triggerRadius`, {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-[10px] text-[var(--color-muted-foreground)]">
                      Default 30 m. Leave empty to use it.
                    </p>
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
                <MapCoordsPicker
                  persistKey={`excursion-stop-${idx}`}
                  latitude={form.watch(`stops.${idx}.coords.latitude`) ?? 0}
                  longitude={form.watch(`stops.${idx}.coords.longitude`) ?? 0}
                  radiusMeters={
                    form.watch(`stops.${idx}.triggerRadius`) ||
                    DEFAULT_TRIGGER_RADIUS_M
                  }
                  siblings={stops.fields
                    .map((_, sIdx) => {
                      if (sIdx === idx) return null
                      const lat = form.watch(
                        `stops.${sIdx}.coords.latitude`,
                      )
                      const lng = form.watch(
                        `stops.${sIdx}.coords.longitude`,
                      )
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        return null
                      }
                      if (lat === 0 && lng === 0) return null
                      return {
                        latitude: lat as number,
                        longitude: lng as number,
                        radiusMeters:
                          form.watch(`stops.${sIdx}.triggerRadius`) ||
                          DEFAULT_TRIGGER_RADIUS_M,
                      }
                    })
                    .filter((s): s is NonNullable<typeof s> => s !== null)}
                  onChange={({ latitude, longitude }) => {
                    form.setValue(`stops.${idx}.coords.latitude`, latitude, {
                      shouldDirty: true,
                    })
                    form.setValue(`stops.${idx}.coords.longitude`, longitude, {
                      shouldDirty: true,
                    })
                  }}
                />
                <SingleImageInput
                  control={form.control}
                  name={`stops.${idx}.image`}
                  label="Hero image"
                  required
                  hint="Thumbnail in the stops list; on arrival, used as the image in the 'You have arrived' card and as the first slide of the stop detail sheet's image carousel."
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}`}
                />
                <LocalizedInput
                  control={form.control}
                  name={`stops.${idx}.name`}
                  label="Name"
                  required
                  hint="Stop label shown in the bottom stops list, on the map marker callout, and at the top of the stop detail sheet."
                />
                <LocalizedInput
                  control={form.control}
                  name={`stops.${idx}.description`}
                  label="Description"
                  required
                  multiline
                  hint="Long text shown on the arrived card and in the stop detail sheet body. Becomes the script the user reads on arrival."
                />
                <ImageListInput
                  control={form.control}
                  name={`stops.${idx}.images`}
                  label="Gallery images"
                  hint="Swipeable carousel at the top of the stop detail sheet. First image replaces the single hero on the carousel."
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}/gallery`}
                />
                <AudioInput
                  control={form.control}
                  name={`stops.${idx}.audioUrl`}
                  label="Audio guide"
                  hint="Plays in the audio card inside the stop detail sheet. Ignored when this stop has sub-stops (the bundle case) — sub-stops carry their own audio."
                  folder={`excursion/${form.watch('slug') || 'untitled'}/stops/${form.watch(`stops.${idx}.slug`) || `stop-${idx}`}`}
                />
                <SubStopsEditor
                  form={form}
                  stopIdx={idx}
                  excursionSlug={form.watch('slug') || 'untitled'}
                  stopSlug={
                    form.watch(`stops.${idx}.slug`) || `stop-${idx}`
                  }
                />
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Seed the new stop's coords from the previous stop so the
              // editor doesn't have to drop a fresh pin halfway across the
              // world. Falls back to (0, 0) only on the very first stop.
              const prevIdx = stops.fields.length - 1
              const prevCoords =
                prevIdx >= 0
                  ? form.getValues(`stops.${prevIdx}.coords`)
                  : null
              const seedCoords =
                prevCoords &&
                typeof prevCoords.latitude === 'number' &&
                typeof prevCoords.longitude === 'number' &&
                !Number.isNaN(prevCoords.latitude) &&
                !Number.isNaN(prevCoords.longitude)
                  ? { ...prevCoords }
                  : { latitude: 0, longitude: 0 }
              stops.append({
                slug: '',
                order: stops.fields.length,
                name: { en: '' },
                description: { en: '' },
                coords: seedCoords,
                image: '',
                images: [],
                subStops: [],
              })
            }}
          >
            <Plus className="h-4 w-4" />
            Add stop
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">POIs along the route</p>
            <FieldHint text="POIs render as colored circle markers on the excursion map during the preview phase and as rows interleaved with stops in the bottom navigation list. Tapping a POI marker opens its detail sheet. POIs are hidden while the user is actively navigating to the next stop." />
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            POIs are references to places in this city. To create a new POI,
            add it under /discover/places first, then check it here. Order
            controls where it appears in the unified stops + POIs list on
            mobile.
          </p>
          <PlacePicker
            citySlug={citySlug}
            value={pois.map((p) => p.placeSlug)}
            onChange={(nextSlugs) => {
              // Preserve existing orders when keeping slugs; assign the next
              // available order to newly added ones.
              const existingByslug = new Map(
                pois.map((p) => [p.placeSlug, p.order] as const),
              )
              const used = new Set<number>()
              const next = nextSlugs.map((slug, i) => {
                const order = existingByslug.get(slug)
                if (order !== undefined && !used.has(order)) {
                  used.add(order)
                  return { placeSlug: slug, order }
                }
                // Find the lowest unused order starting from `i`.
                let next = i
                while (used.has(next)) next++
                used.add(next)
                return { placeSlug: slug, order: next }
              })
              form.setValue('pois', next, { shouldDirty: true })
            }}
            label="POIs"
            emptyHint="Pick a city above to see available places."
          />
          {pois.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Order per POI
              </p>
              {pois.map((poi, idx) => (
                <div key={poi.placeSlug} className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-mono">{poi.placeSlug}</span>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      {...form.register(`pois.${idx}.order`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              Interesting facts ({facts.fields.length})
            </p>
            <FieldHint text="Short narration cards that play during long walking legs (≥150m or ≥2 min), distributed across the excursion. Mobile shows a floating amber 'Did you know?' banner that auto-rotates through the facts you author here." />
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Short narration cards attached to the excursion, independent of
            stops. Each card needs at least one audio file in any locale.
          </p>
          {facts.fields.map((field, idx) => (
            <Card key={field.id} className="border-dashed">
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-[var(--color-muted-foreground)]">
                    Fact {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => facts.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <LocalizedInput
                  control={form.control}
                  name={`interestingFacts.${idx}.title`}
                  label="Title"
                  required
                  hint="Short line shown in the floating amber 'Did you know?' banner during walking legs, and at the top of the audio sheet when the user taps the banner."
                />
                <AudioInput
                  control={form.control}
                  name={`interestingFacts.${idx}.audioUrl`}
                  label="Narration"
                  hint="The audio file that plays when the user taps the banner. One file per language; mobile picks the user's locale."
                  folder={`excursion/${form.watch('slug') || 'untitled'}/facts/${form.watch(`interestingFacts.${idx}.slug`) || `fact-${idx}`}`}
                />
                <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">
                      Geocoded trigger (optional)
                    </p>
                    <FieldHint text="Set coords + radius to fire this fact when the user enters that area, regardless of which leg they're on. Leave blank to use the default 'distance into the leg' heuristic. Set both fields or neither." />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        {...form.register(
                          `interestingFacts.${idx}.coords.latitude`,
                          { valueAsNumber: true },
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        {...form.register(
                          `interestingFacts.${idx}.coords.longitude`,
                          { valueAsNumber: true },
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Radius (m)</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        {...form.register(
                          `interestingFacts.${idx}.triggerRadius`,
                          { valueAsNumber: true },
                        )}
                      />
                    </div>
                  </div>
                  <MapCoordsPicker
                    persistKey={`excursion-fact-${idx}`}
                    latitude={
                      form.watch(
                        `interestingFacts.${idx}.coords.latitude`,
                      ) ?? 0
                    }
                    longitude={
                      form.watch(
                        `interestingFacts.${idx}.coords.longitude`,
                      ) ?? 0
                    }
                    radiusMeters={
                      form.watch(`interestingFacts.${idx}.triggerRadius`) ||
                      DEFAULT_TRIGGER_RADIUS_M
                    }
                    onChange={({ latitude, longitude }) => {
                      form.setValue(
                        `interestingFacts.${idx}.coords.latitude`,
                        latitude,
                        { shouldDirty: true },
                      )
                      form.setValue(
                        `interestingFacts.${idx}.coords.longitude`,
                        longitude,
                        { shouldDirty: true },
                      )
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              facts.append({
                slug: '',
                title: { en: '' },
                audioUrl: {},
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add fact
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Outro</p>
              <FieldHint text="A wrap-up card shown to the user after they finish (or skip past) the last stop. Use it for a thank-you, sign-off, and any final recommendations. No GPS — opens automatically after the last stop." />
            </div>
            <Switch
              checked={!!form.watch('outroEnabled')}
              onCheckedChange={(v) =>
                form.setValue('outroEnabled', v, { shouldDirty: true })
              }
            />
          </div>
          {form.watch('outroEnabled') && (
            <div className="flex flex-col gap-3">
              <SingleImageInput
                control={form.control}
                name="outro.image"
                label="Hero image"
                required
                hint="Image at the top of the outro card."
                folder={`excursion/${form.watch('slug') || 'untitled'}/outro`}
              />
              <LocalizedInput
                control={form.control}
                name="outro.title"
                label="Title"
                required
                hint="Short heading at the top of the outro. e.g. 'Thank you for joining'."
              />
              <LocalizedInput
                control={form.control}
                name="outro.description"
                label="Description"
                required
                multiline
                hint="Long-form sign-off + recommendations. Shown alongside the audio."
              />
              <ImageListInput
                control={form.control}
                name="outro.images"
                label="Gallery images"
                hint="Optional swipeable carousel for the outro."
                folder={`excursion/${form.watch('slug') || 'untitled'}/outro/gallery`}
              />
              <AudioInput
                control={form.control}
                name="outro.audioUrl"
                label="Audio narration"
                hint="Plays in the outro card. Optional."
                folder={`excursion/${form.watch('slug') || 'untitled'}/outro`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Weather exposure</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Drives the mobile app's "check the forecast" recommendation
              on the excursion preview. Choose based on where the walker
              actually spends most of their time on the route.
            </p>
          </div>
          <Select
            value={form.watch('weatherSensitivity')}
            onValueChange={(v) =>
              form.setValue(
                'weatherSensitivity',
                v as 'outdoor' | 'mixed' | 'indoor',
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick exposure" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outdoor">
                Outdoor — walking outside most of the route (strong weather
                warning on rain / wind).
              </SelectItem>
              <SelectItem value="mixed">
                Mixed — indoor stops with outdoor connections (soft "bring
                an umbrella" nudge).
              </SelectItem>
              <SelectItem value="indoor">
                Indoor — museum tour, covered market, etc (weather warning
                suppressed).
              </SelectItem>
            </SelectContent>
          </Select>
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

      <div className="flex flex-wrap justify-end items-center gap-3">
        <DraftBadge status={draftStatus} />
        <div className="flex gap-2">
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
      </div>
    </form>
  )
}

function normalizePayload(raw: CreateValues): CreateValues {
  // Strip the form-only outroEnabled flag and drop outro entirely when
  // disabled. The api treats absence as "no outro" rather than an empty
  // shell.
  const outroEnabled = (raw as Record<string, unknown>).outroEnabled === true
  const cloned = { ...raw } as Record<string, unknown>
  delete cloned.outroEnabled
  if (!outroEnabled) delete cloned.outro
  const out = stripEmpties(cloned) as Record<string, unknown>

  // Drop optional fact audio locales that are empty strings (the upload
  // input writes '' before a file is chosen). Also strip half-filled
  // coords pairs — if either lat or lng is missing, treat the geocoded
  // trigger as unset rather than sending a broken coord pair.
  const facts = out.interestingFacts as
    | Array<{
        audioUrl?: Record<string, unknown>
        coords?: { latitude?: number; longitude?: number }
      }>
    | undefined
  if (facts) {
    for (const f of facts) {
      if (f.audioUrl) {
        for (const [k, v] of Object.entries(f.audioUrl)) {
          if (!v) delete (f.audioUrl as Record<string, unknown>)[k]
        }
      }
      if (
        f.coords &&
        (typeof f.coords.latitude !== 'number' ||
          typeof f.coords.longitude !== 'number' ||
          Number.isNaN(f.coords.latitude) ||
          Number.isNaN(f.coords.longitude))
      ) {
        delete f.coords
      }
    }
  }

  // Sort + renumber stops by their typed `order` field so what the editor
  // wrote matches what's persisted. Without this the array would save in
  // form-render order (the order the editor added them) regardless of the
  // numbers they typed. Renumbering 0..N-1 keeps the field contiguous so
  // future edits stay readable. Same treatment for POIs which also carry
  // an explicit order. Sub-stops are intentionally left alone — their
  // array position IS the order (no `order` field).
  const stops = out.stops as Array<{ order?: number }> | undefined
  if (stops) {
    stops.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    stops.forEach((s, i) => {
      s.order = i
    })
  }
  const pois = out.pois as Array<{ order?: number }> | undefined
  if (pois) {
    pois.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    pois.forEach((p, i) => {
      p.order = i
    })
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

// Per-stop sub-stops editor. Nested useFieldArray keyed inside its own
// component so the parent stops array doesn't have to know the row count.
// Sub-stops have no `order` field — array position drives display order on
// mobile. Editors reorder with the up/down arrow buttons.
function SubStopsEditor({
  form,
  stopIdx,
  excursionSlug,
  stopSlug,
}: {
  form: ReturnType<typeof useForm<CreateValues>>
  stopIdx: number
  excursionSlug: string
  stopSlug: string
}) {
  const subStops = useFieldArray({
    control: form.control,
    name: `stops.${stopIdx}.subStops` as const,
  })
  const count = subStops.fields.length

  // Auto-derive each sub-stop's slug from its name.en, unique within this
  // parent stop's subStops array.
  const watchedNames = subStops.fields
    .map((_, i) =>
      form.watch(`stops.${stopIdx}.subStops.${i}.name.en`) ?? '',
    )
    .join('|')
  useEffect(() => {
    const taken = new Set<string>()
    subStops.fields.forEach((_, i) => {
      const nameEn =
        form.watch(`stops.${stopIdx}.subStops.${i}.name.en`) ?? ''
      const base = slugify(nameEn) || `sub-stop-${i + 1}`
      const unique = buildUniqueSlug(base, taken)
      taken.add(unique)
      const path =
        `stops.${stopIdx}.subStops.${i}.slug` as const
      if (form.getValues(path) !== unique) {
        form.setValue(path, unique, { shouldValidate: true })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedNames, count, stopIdx])

  return (
    <div className="flex flex-col gap-3 mt-2 pt-3 border-t border-dashed border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium">Sub-stops ({count})</p>
        <FieldHint text="Sub-stops turn this stop into a 'bundle'. Use them when one location (e.g. a square) has multiple narrated points. The user arrives once and steps through each sub-stop's content in order. Map shows a numbered pin; the parent stop's audio is ignored when sub-stops exist." />
      </div>

      {subStops.fields.map((field, i) => (
        <Card key={field.id} className="border-dashed">
          <CardContent className="pt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-[var(--color-muted-foreground)]">
                Sub-stop {i + 1}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === 0}
                  onClick={() => subStops.move(i, i - 1)}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === count - 1}
                  onClick={() => subStops.move(i, i + 1)}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => subStops.remove(i)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SingleImageInput
              control={form.control}
              name={`stops.${stopIdx}.subStops.${i}.image`}
              label="Hero image"
              required
              hint="Shown at the top of the sub-stop card during arrival."
              folder={`excursion/${excursionSlug}/stops/${stopSlug}/sub-stops/${form.watch(`stops.${stopIdx}.subStops.${i}.slug`) || `sub-stop-${i}`}`}
            />
            <LocalizedInput
              control={form.control}
              name={`stops.${stopIdx}.subStops.${i}.name`}
              label="Name"
              required
              hint="Sub-stop label shown in the arrival card header."
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register(
                    `stops.${stopIdx}.subStops.${i}.coords.latitude`,
                    { valueAsNumber: true },
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register(
                    `stops.${stopIdx}.subStops.${i}.coords.longitude`,
                    { valueAsNumber: true },
                  )}
                />
              </div>
            </div>
            <MapCoordsPicker
              persistKey={`excursion-substop-${stopIdx}-${i}`}
              latitude={
                form.watch(`stops.${stopIdx}.subStops.${i}.coords.latitude`) ?? 0
              }
              longitude={
                form.watch(`stops.${stopIdx}.subStops.${i}.coords.longitude`) ?? 0
              }
              // Sub-stops don't have their own geofence — the parent stop's
              // arrival radius (at the parent's coords) is what actually
              // fires. Render that circle here as a sibling so editors can
              // see whether the sub-stop pin falls inside the arrival zone.
              siblings={(() => {
                const pLat = form.watch(`stops.${stopIdx}.coords.latitude`)
                const pLng = form.watch(`stops.${stopIdx}.coords.longitude`)
                if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) return []
                if (pLat === 0 && pLng === 0) return []
                return [
                  {
                    latitude: pLat as number,
                    longitude: pLng as number,
                    radiusMeters:
                      form.watch(`stops.${stopIdx}.triggerRadius`) ||
                      DEFAULT_TRIGGER_RADIUS_M,
                  },
                ]
              })()}
              onChange={({ latitude, longitude }) => {
                form.setValue(
                  `stops.${stopIdx}.subStops.${i}.coords.latitude`,
                  latitude,
                  { shouldDirty: true },
                )
                form.setValue(
                  `stops.${stopIdx}.subStops.${i}.coords.longitude`,
                  longitude,
                  { shouldDirty: true },
                )
              }}
            />
            <LocalizedInput
              control={form.control}
              name={`stops.${stopIdx}.subStops.${i}.description`}
              label="Description"
              required
              multiline
              hint="Long-form text shown alongside the audio when the user reaches this sub-stop."
            />
            <ImageListInput
              control={form.control}
              name={`stops.${stopIdx}.subStops.${i}.images`}
              label="Gallery images"
              hint="Optional swipeable carousel for this sub-stop."
              folder={`excursion/${excursionSlug}/stops/${stopSlug}/sub-stops/${form.watch(`stops.${stopIdx}.subStops.${i}.slug`) || `sub-stop-${i}`}/gallery`}
            />
            <AudioInput
              control={form.control}
              name={`stops.${stopIdx}.subStops.${i}.audioUrl`}
              label="Audio guide"
              hint="Plays when the user reaches this sub-stop in the bundle."
              folder={`excursion/${excursionSlug}/stops/${stopSlug}/sub-stops/${form.watch(`stops.${stopIdx}.subStops.${i}.slug`) || `sub-stop-${i}`}`}
            />
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          // Seed new sub-stops at the parent's coords so the editor only
          // has to nudge the pin, not drop one halfway across the world.
          // Falls back to (0, 0) if the parent has no coords yet (which
          // shouldn't happen since coords are required on the parent).
          const parentCoords = form.getValues(`stops.${stopIdx}.coords`)
          const seedCoords =
            parentCoords &&
            typeof parentCoords.latitude === 'number' &&
            typeof parentCoords.longitude === 'number' &&
            !Number.isNaN(parentCoords.latitude) &&
            !Number.isNaN(parentCoords.longitude)
              ? { ...parentCoords }
              : { latitude: 0, longitude: 0 }
          subStops.append({
            slug: '',
            name: { en: '' },
            description: { en: '' },
            coords: seedCoords,
            image: '',
            images: [],
          })
        }}
      >
        <Plus className="h-4 w-4" />
        Add sub-stop
      </Button>
    </div>
  )
}
