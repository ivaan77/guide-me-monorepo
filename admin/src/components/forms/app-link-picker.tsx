'use client'

import { useEffect, useState, useTransition } from 'react'
import type { AdminCity, AdminExcursion, AdminPlace, AppLinkAttrs, AppLinkKind } from '@guide-me-app/core'
import { listCitiesAction } from '@/actions/cities'
import { listExcursionsAction } from '@/actions/excursions'
import { listPlacesAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Modal-style picker used by the TipTap editor to insert an appLink
// node. Opens with kind tabs (City / Place / Excursion), a search box,
// and a list of results. Clicking a row inserts the node and closes.
//
// Data is fetched lazily per tab — first click on 'City' triggers the
// cities list, and results are cached in local state for the picker
// lifetime. Closing + reopening refetches (cheap; admin lists are
// small).

type Props = {
  open: boolean
  onClose: () => void
  onPick: (attrs: AppLinkAttrs) => void
}

type Kind = AppLinkKind

const KIND_LABEL: Record<Kind, string> = {
  city: 'City',
  place: 'Place',
  excursion: 'Excursion',
}

const KIND_ORDER: Kind[] = ['city', 'excursion', 'place']

// Adapter row so the list is a homogeneous shape regardless of source
// entity.
type Row = {
  id: string
  label: string
  imageUrl?: string
  meta?: string
}

export function AppLinkPicker({ open, onClose, onPick }: Props) {
  const [kind, setKind] = useState<Kind>('city')
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState<AdminCity[] | null>(null)
  const [places, setPlaces] = useState<AdminPlace[] | null>(null)
  const [excursions, setExcursions] = useState<AdminExcursion[] | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      if (kind === 'city' && cities === null) {
        const res = await listCitiesAction()
        setCities(res)
      } else if (kind === 'place' && places === null) {
        const res = await listPlacesAction()
        setPlaces(res)
      } else if (kind === 'excursion' && excursions === null) {
        const res = await listExcursionsAction()
        setExcursions(res)
      }
    })
  }, [open, kind, cities, places, excursions])

  if (!open) return null

  const rows = toRows(kind, cities, places, excursions).filter((r) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      r.label.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.meta && r.meta.toLowerCase().includes(q))
    )
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Insert app link</h2>
            <button
              type="button"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {KIND_ORDER.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  kind === k
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-muted)] text-[var(--color-ink-2)]'
                }`}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <Input
            className="mt-3"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
              {isLoading(kind, cities, places, excursions)
                ? 'Loading…'
                : 'No matches.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {rows.map((row) => (
                <li key={`${kind}:${row.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[var(--color-muted)]"
                    onClick={() => {
                      onPick({
                        kind,
                        id: row.id,
                        label: row.label,
                        imageUrl: row.imageUrl,
                      })
                      onClose()
                    }}
                  >
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded object-cover bg-[var(--color-muted)]"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[var(--color-muted)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {row.label}
                      </p>
                      {row.meta && (
                        <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                          {row.meta}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] p-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function isLoading(
  kind: Kind,
  cities: AdminCity[] | null,
  places: AdminPlace[] | null,
  excursions: AdminExcursion[] | null,
): boolean {
  if (kind === 'city') return cities === null
  if (kind === 'place') return places === null
  return excursions === null
}

function toRows(
  kind: Kind,
  cities: AdminCity[] | null,
  places: AdminPlace[] | null,
  excursions: AdminExcursion[] | null,
): Row[] {
  if (kind === 'city') {
    return (cities ?? []).map((c) => ({
      id: c.slug,
      label: c.name.en,
      imageUrl: c.image,
      meta: c.country.en,
    }))
  }
  if (kind === 'excursion') {
    return (excursions ?? []).map((e) => ({
      id: e.slug,
      label: e.name.en,
      imageUrl: e.image,
      meta: e.citySlug,
    }))
  }
  return (places ?? []).map((p) => ({
    id: p.slug,
    label: p.name.en,
    imageUrl: p.image,
    meta: `${p.category} · ${p.citySlug}`,
  }))
}
