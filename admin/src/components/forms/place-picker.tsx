'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import type { AdminPlace, PoiCategory } from '@guide-me-app/core'
import { listPlacesAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import { FieldHint } from './field-hint'
import { Label } from '@/components/ui/label'

// Category labels match what the place form / mobile UI render. Keep in sync
// with the PoiCategory union in @guide-me-app/core.
const CATEGORY_LABEL: Record<PoiCategory, string> = {
  restaurant: 'Restaurants',
  cafe: 'Cafés',
  bar: 'Bars',
  shopping: 'Shopping',
  event: 'Events',
  park: 'Parks',
}

const CATEGORY_ORDER: PoiCategory[] = [
  'restaurant',
  'cafe',
  'bar',
  'shopping',
  'event',
  'park',
]

type Props = {
  // The city to fetch places for. Picker is hidden when this is empty
  // (e.g. on a create-form before the city has been saved).
  citySlug: string
  // The currently chosen ordered slug list.
  value: string[]
  onChange: (next: string[]) => void
  label: string
  hint?: string
  emptyHint?: string
}

// Multi-select with two halves:
//   - left: checkbox list of every place in the city, grouped by category
//   - right: the chosen slugs in their current order, each with up/down arrows
// Reorder is by chosen-side controls only; checking a place appends to the
// end of the chosen list.
export function PlacePicker({
  citySlug,
  value,
  onChange,
  label,
  hint,
  emptyHint,
}: Props) {
  const [places, setPlaces] = useState<AdminPlace[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citySlug) {
      setPlaces(null)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)
    listPlacesAction(citySlug)
      .then((res) => {
        if (!cancelled) setPlaces(res)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [citySlug])

  const grouped = useMemo(() => {
    const map = new Map<PoiCategory, AdminPlace[]>()
    for (const p of places ?? []) {
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    }
    return map
  }, [places])

  const bySlug = useMemo(() => {
    const map = new Map<string, AdminPlace>()
    for (const p of places ?? []) map.set(p.slug, p)
    return map
  }, [places])

  const toggle = (slug: string) => {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug))
    } else {
      onChange([...value, slug])
    }
  }

  const move = (slug: string, direction: -1 | 1) => {
    const idx = value.indexOf(slug)
    const target = idx + direction
    if (idx < 0 || target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  if (!citySlug) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label>{label}</Label>
          {hint && <FieldHint text={hint} />}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {emptyHint ?? 'Save the parent first to attach places.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label>{label}</Label>
          {hint && <FieldHint text={hint} />}
        </div>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {value.length} selected
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading places…
        </div>
      )}
      {error && (
        <p className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}

      {!isLoading && !error && places && places.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          No places exist for this city yet. Create some in /discover/places first.
        </p>
      )}

      {!isLoading && places && places.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-[var(--color-border)] p-3 flex flex-col gap-3">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Available
            </p>
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? []
              if (items.length === 0) return null
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    {CATEGORY_LABEL[cat]}
                  </p>
                  {items.map((p) => (
                    <label
                      key={p.slug}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(p.slug)}
                        onChange={() => toggle(p.slug)}
                      />
                      <span>{p.name.en}</span>
                      <span className="text-[10px] font-mono text-[var(--color-muted-foreground)]">
                        {p.slug}
                      </span>
                    </label>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="rounded-md border border-[var(--color-border)] p-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Chosen (in order)
            </p>
            {value.length === 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Nothing selected yet.
              </p>
            )}
            {value.map((slug, idx) => {
              const p = bySlug.get(slug)
              return (
                <div
                  key={slug}
                  className="flex items-center gap-2 text-sm border border-[var(--color-border)] rounded px-2 py-1"
                >
                  <span className="text-[10px] w-5 font-mono text-[var(--color-muted-foreground)]">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate">
                    {p?.name.en ?? (
                      <span className="italic text-[var(--color-destructive)]">
                        {slug} (missing place)
                      </span>
                    )}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => move(slug, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === value.length - 1}
                    onClick={() => move(slug, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
