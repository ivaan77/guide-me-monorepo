'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Save, Search, X } from 'lucide-react'
import type { AdminGalleryItem } from '@guide-me-app/core'
import { updateGalleryAction } from '@/actions/web-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  initial: AdminGalleryItem[]
}

// Bulk gallery editor. Two columns:
//   - Left: searchable candidate list. Every enabled or disabled city/place
//     shows here; clicking Feature moves it to the right at the bottom.
//   - Right: current featured selection, in order. Up/down arrows reorder;
//     the X unfeatures. Ordering is stored as `webFeaturedOrder`, saved on
//     the Save button as a bulk PATCH.
//
// The initial dataset is fed once from the server via props. All mutations
// happen in local state until Save is clicked, at which point a single
// PATCH ships the full result. On success we don't re-fetch — we trust
// what we just sent.
export function GalleryEditor({ initial }: Props) {
  // Two derived views over one flat map keyed by "type:slug".
  const [byKey, setByKey] = useState<Map<string, AdminGalleryItem>>(
    () => new Map(initial.map((i) => [keyOf(i), i])),
  )
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  const featured = useMemo(
    () =>
      [...byKey.values()]
        .filter((i) => i.webFeatured)
        .sort(
          (a, b) =>
            a.webFeaturedOrder - b.webFeaturedOrder ||
            a.slug.localeCompare(b.slug),
        ),
    [byKey],
  )

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = [...byKey.values()].filter((i) => !i.webFeatured)
    if (!q) return all.slice(0, 200) // cap noise; typing narrows it
    return all.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        (i.subtitle?.toLowerCase().includes(q) ?? false),
    )
  }, [byKey, query])

  const setItem = (item: AdminGalleryItem) => {
    setByKey((prev) => {
      const next = new Map(prev)
      next.set(keyOf(item), item)
      return next
    })
  }

  const featureItem = (item: AdminGalleryItem) => {
    // New featured items land at the end of the current featured list.
    const nextOrder =
      featured.length === 0
        ? 0
        : Math.max(...featured.map((f) => f.webFeaturedOrder)) + 1
    setItem({ ...item, webFeatured: true, webFeaturedOrder: nextOrder })
  }

  const unfeatureItem = (item: AdminGalleryItem) => {
    setItem({ ...item, webFeatured: false, webFeaturedOrder: 0 })
    // Compact the remaining orders so gaps don't accumulate.
    compactOrders()
  }

  const moveItem = (item: AdminGalleryItem, direction: -1 | 1) => {
    const idx = featured.findIndex((f) => keyOf(f) === keyOf(item))
    const targetIdx = idx + direction
    if (idx < 0 || targetIdx < 0 || targetIdx >= featured.length) return
    const other = featured[targetIdx]
    // Swap by reassigning contiguous 0..N-1 orders after the swap.
    const reordered = [...featured]
    reordered[idx] = other
    reordered[targetIdx] = item
    setByKey((prev) => {
      const next = new Map(prev)
      reordered.forEach((it, i) => {
        next.set(keyOf(it), { ...it, webFeaturedOrder: i })
      })
      return next
    })
  }

  const compactOrders = () => {
    setByKey((prev) => {
      const next = new Map(prev)
      const remaining = [...next.values()]
        .filter((i) => i.webFeatured)
        .sort(
          (a, b) =>
            a.webFeaturedOrder - b.webFeaturedOrder ||
            a.slug.localeCompare(b.slug),
        )
      remaining.forEach((it, i) => {
        next.set(keyOf(it), { ...it, webFeaturedOrder: i })
      })
      return next
    })
  }

  const onSave = () => {
    startTransition(async () => {
      const payload = {
        items: [...byKey.values()].map((i) => ({
          slug: i.slug,
          sourceType: i.sourceType,
          webFeatured: i.webFeatured,
          webFeaturedOrder: i.webFeaturedOrder,
        })),
      }
      const res = await updateGalleryAction(payload)
      if (res.ok) {
        toast.success('Gallery saved.')
      } else {
        toast.error(`Save failed: ${res.error}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured list */}
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Featured ({featured.length})
          </p>
          {featured.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Nothing featured yet — pick items from the right to add them here.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {featured.map((item, i) => (
              <FeaturedRow
                key={keyOf(item)}
                item={item}
                index={i}
                total={featured.length}
                onUp={() => moveItem(item, -1)}
                onDown={() => moveItem(item, +1)}
                onRemove={() => unfeatureItem(item)}
              />
            ))}
          </div>
        </div>

        {/* Candidate list */}
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Available
          </p>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <Input
              placeholder="Search cities and places..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
            {candidates.map((item) => (
              <CandidateRow
                key={keyOf(item)}
                item={item}
                onFeature={() => featureItem(item)}
              />
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] px-2 py-4">
                No matches.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={onSave} disabled={pending} className="gap-2">
          <Save className="h-4 w-4" />
          {pending ? 'Saving…' : 'Save gallery'}
        </Button>
      </div>
    </div>
  )
}

function FeaturedRow({
  item,
  index,
  total,
  onUp,
  onDown,
  onRemove,
}: {
  item: AdminGalleryItem
  index: number
  total: number
  onUp: () => void
  onDown: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] p-2">
      <span className="w-6 text-center text-xs font-mono text-[var(--color-muted-foreground)]">
        {index + 1}
      </span>
      <Thumb src={item.image} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-[10px] font-mono text-[var(--color-muted-foreground)] truncate">
          {item.sourceType} · {item.slug}
          {item.subtitle ? ` · ${item.subtitle}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUp}
          disabled={index === 0}
          aria-label="Move up"
          type="button"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDown}
          disabled={index === total - 1}
          aria-label="Move down"
          type="button"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Unfeature"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function CandidateRow({
  item,
  onFeature,
}: {
  item: AdminGalleryItem
  onFeature: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] p-2">
      <Thumb src={item.image} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-[10px] font-mono text-[var(--color-muted-foreground)] truncate">
          {item.sourceType} · {item.slug}
          {item.subtitle ? ` · ${item.subtitle}` : ''}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onFeature}
        type="button"
      >
        Feature
      </Button>
    </div>
  )
}

function Thumb({ src }: { src?: string }) {
  if (!src) {
    return (
      <div className="h-10 w-14 rounded bg-[var(--color-muted)] flex-shrink-0" />
    )
  }
  return (
    // Bare <img> — Next/Image needs remote patterns configured for the CDN,
    // and admin thumbnails aren't performance-critical. Same pattern the
    // existing image-input component uses.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-10 w-14 rounded object-cover flex-shrink-0"
    />
  )
}

function keyOf(item: AdminGalleryItem): string {
  return `${item.sourceType}:${item.slug}`
}
