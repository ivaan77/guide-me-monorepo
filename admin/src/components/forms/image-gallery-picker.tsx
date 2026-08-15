'use client'

import { useEffect, useState } from 'react'
import type {
  ImageGalleryEntry,
  ImageGallerySource,
} from '@guide-me-app/core'
import type { MediaListResponse } from '@/app/api/media/list/route'
import { listImageGalleryAction } from '@/actions/image-gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Modal that lets the author pick any previously-uploaded image —
// merging (a) images referenced by any content doc with (b) raw
// bucket objects from the Media page's library. Fetches on open (not
// on mount) so closed pickers cost nothing. Cached in a module-level
// ref for the lifetime of the page so quickly re-opening the modal
// doesn't refetch.

type Props = {
  open: boolean
  onClose: () => void
  onPick: (url: string) => void
}

const SOURCE_LABEL: Record<ImageGallerySource, string> = {
  city: 'City',
  place: 'Place',
  excursion: 'Excursion',
  blog: 'Blog',
  library: 'Library',
}

// Module-level cache so a single admin session reuses the same entries
// across every ImageInput on the page. Refetched only on picker-first-
// open per page load. Content edits don't invalidate it — the author
// can close/reopen the picker to force a refetch by refreshing the
// page, which is rare enough not to warrant per-open cache-busting.
let cachedEntries: ImageGalleryEntry[] | null = null

export function ImageGalleryPicker({ open, onClose, onPick }: Props) {
  const [entries, setEntries] = useState<ImageGalleryEntry[] | null>(
    cachedEntries,
  )
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    // Cache is already populated (from another picker instance that
    // opened first): sync local state from the cache. Without this,
    // pickers that mounted while the cache was still null get stuck
    // showing "Loading gallery…" forever on re-open — their useEffect
    // early-returns before setEntries ever runs.
    if (cachedEntries !== null) {
      if (entries === null) setEntries(cachedEntries)
      return
    }
    setIsLoading(true)
    // Merge two sources so freshly-uploaded (but unattached) library
    // images show up alongside images already referenced by content:
    //   1. gallery action → images referenced by any content doc
    //      (carries meaningful source + label like "City · Zagreb")
    //   2. /api/media/list → every object in the GCS bucket
    //      (catches uploads from the Media page that aren't attached yet)
    // Referenced entries win on URL collision — their labels are more
    // useful than the raw filename we'd derive from a bucket object.
    Promise.all([
      listImageGalleryAction(),
      fetch('/api/media/list')
        .then(async (res) => {
          if (!res.ok) throw new Error(`Media list failed (${res.status})`)
          return (await res.json()) as MediaListResponse
        })
        .catch(() => ({ items: [] }) as MediaListResponse),
    ])
      .then(([referenced, mediaList]) => {
        const byUrl = new Map<string, ImageGalleryEntry>()
        for (const entry of referenced) {
          byUrl.set(entry.url, entry)
        }
        for (const item of mediaList.items) {
          if (byUrl.has(item.url)) continue
          const shortName = item.name.split('/').pop() ?? item.name
          byUrl.set(item.url, {
            url: item.url,
            source: 'library',
            sourceLabel: shortName,
          })
        }
        const merged = Array.from(byUrl.values())
        cachedEntries = merged
        setEntries(merged)
      })
      .catch(() => {
        setEntries([])
      })
      .finally(() => setIsLoading(false))
  }, [open])

  if (!open) return null

  const q = query.trim().toLowerCase()
  const filtered =
    entries?.filter(
      (e) =>
        !q ||
        e.url.toLowerCase().includes(q) ||
        e.sourceLabel.toLowerCase().includes(q),
    ) ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pick from gallery</h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Images from the Media library and anywhere already
                referenced in content.
              </p>
            </div>
            <button
              type="button"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <Input
            className="mt-3"
            placeholder="Search by URL or source…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading || entries === null ? (
            <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
              Loading gallery…
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
              {entries.length === 0
                ? 'No images yet. Upload one on the Media page, or save an image on any city / place / excursion / blog.'
                : 'No matches for your search.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((entry) => (
                <button
                  key={entry.url}
                  type="button"
                  className="group flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] text-left hover:border-[var(--color-primary)]"
                  onClick={() => {
                    onPick(entry.url)
                    onClose()
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.url}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover bg-[var(--color-muted)]"
                  />
                  <div className="flex flex-col gap-0.5 p-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                      {SOURCE_LABEL[entry.source]}
                    </span>
                    <span className="truncate text-xs text-[var(--color-ink-2)]">
                      {entry.sourceLabel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
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
