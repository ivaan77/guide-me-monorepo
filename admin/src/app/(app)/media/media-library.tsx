'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2,
  CheckSquare,
  ClipboardCopy,
  Loader2,
  Square,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ImageGalleryEntry } from '@guide-me-app/core'
import type { MediaItem, MediaListResponse } from '@/app/api/media/list/route'
import type {
  MediaDeleteRequest,
  MediaDeleteResponse,
} from '@/app/api/media/delete/route'
import { listImageGalleryAction } from '@/actions/image-gallery'
import { uploadImage } from '@/components/forms/single-image-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Where new library uploads land inside the bucket's image/ tree. Kept
// distinct from city / place / excursion folders so authors browsing
// the "Browse" tab can distinguish freeform uploads from content-tied
// ones just by the URL path.
const LIBRARY_FOLDER = 'library'

// Renders an ISO timestamp as "12 Jul, 14:30" (locale-sensitive). Used
// on every card so authors can spot recently-uploaded assets at a glance.
function fmtUploadedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Client-side upload + browse for the Media page. Two tabs; each is
// self-contained and reloads its own data. Upload appends to a local
// preview stack so users can copy URLs of freshly-uploaded images
// without leaving the tab.

type Tab = 'upload' | 'browse'
type BrowseFilter = 'all' | 'used' | 'orphan'

// Preview of an image the user JUST uploaded in this session. Kept in
// component state (not fetched again) so we can show them immediately
// without waiting for the browse tab to refresh.
type UploadedPreview = {
  url: string
  name: string
  uploadedAt: string
}

export function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('upload')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        <TabButton active={tab === 'upload'} onClick={() => setTab('upload')}>
          Upload
        </TabButton>
        <TabButton active={tab === 'browse'} onClick={() => setTab('browse')}>
          Browse
        </TabButton>
      </div>
      {tab === 'upload' ? <UploadTab /> : <BrowseTab />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
      }`}
    >
      {children}
    </button>
  )
}

// ---------- Upload ----------

function UploadTab() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<UploadedPreview[]>([])

  const handleFiles = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    // Upload sequentially so a slow network doesn't hammer the endpoint
    // with parallel large-file requests. For a few files at a time this
    // is imperceptibly slower than parallel and much friendlier to the
    // GCS write path.
    const next: UploadedPreview[] = []
    let failures = 0
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file, LIBRARY_FOLDER)
        next.push({
          url,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        })
      } catch (err) {
        failures += 1
        toast.error(`Upload failed: ${file.name}`, {
          description: err instanceof Error ? err.message : String(err),
        })
      }
    }
    if (next.length > 0) {
      setPreviews((prev) => [...next, ...prev])
      toast.success(
        next.length === 1
          ? 'Image uploaded'
          : `${next.length} images uploaded`,
      )
    }
    if (failures > 0 && next.length === 0) {
      // Every upload failed — no positive toast, error toasts already shown.
    }
    setIsUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const copyUrl = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL copied')
    } catch {
      toast.error('Copy failed — select and copy manually')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Uploads land under <code>image/library/</code> in the bucket.
            Anything you upload here can be reused everywhere via the &ldquo;Pick
            from gallery&rdquo; button.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? 'Uploading…' : 'Upload images'}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {previews.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
            Just uploaded
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((p) => (
              <UploadedCard key={p.url} preview={p} onCopy={copyUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UploadedCard({
  preview,
  onCopy,
}: {
  preview: UploadedPreview
  onCopy: (url: string) => void
}) {
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview.url}
        alt=""
        loading="lazy"
        className="aspect-square w-full object-cover bg-[var(--color-muted)]"
      />
      <div className="flex flex-col gap-1.5 p-2">
        <span className="truncate text-xs font-semibold" title={preview.name}>
          {preview.name}
        </span>
        <span className="text-[10px] text-[var(--color-muted-foreground)]">
          Uploaded {fmtUploadedAt(preview.uploadedAt)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onCopy(preview.url)}
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copy URL
        </Button>
      </div>
    </Card>
  )
}

// ---------- Browse ----------

function BrowseTab() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [usedUrls, setUsedUrls] = useState<Set<string> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<BrowseFilter>('all')
  const [query, setQuery] = useState('')
  // Selection is a Set<url>. Empty = no selection mode; any entries =
  // selection bar visible. Purely non-destructive; delete only fires on
  // explicit button click.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      // In parallel: list bucket contents + fetch the set of URLs
      // referenced by any content doc. Set-subtract locally to flag
      // orphans (bucket URLs not present in the gallery). No new
      // backend endpoint needed for orphan detection.
      const [listRes, gallery] = await Promise.all([
        fetch('/api/media/list').then(async (res) => {
          if (!res.ok) throw new Error(`List failed (${res.status})`)
          return (await res.json()) as MediaListResponse
        }),
        listImageGalleryAction(),
      ])
      const used = new Set(gallery.map((e: ImageGalleryEntry) => e.url))
      setItems(listRes.items)
      setUsedUrls(used)
      // Drop any selections that no longer exist in the list — e.g. a
      // just-deleted URL. Keeps the selection bar counts accurate.
      setSelected((prev) => {
        const stillValid = new Set<string>()
        const bucketUrls = new Set(listRes.items.map((i) => i.url))
        for (const url of prev) {
          if (bucketUrls.has(url)) stillValid.add(url)
        }
        return stillValid
      })
    } catch (err) {
      toast.error('Could not load media', {
        description: err instanceof Error ? err.message : String(err),
      })
      setItems([])
      setUsedUrls(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const orphanCount = useMemo(() => {
    if (!items || !usedUrls) return 0
    return items.filter((item) => !usedUrls.has(item.url)).length
  }, [items, usedUrls])

  const filtered = useMemo(() => {
    if (!items || !usedUrls) return []
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const isUsed = usedUrls.has(item.url)
      if (filter === 'used' && !isUsed) return false
      if (filter === 'orphan' && isUsed) return false
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, usedUrls, filter, query])

  const toggleSelect = (url: string, isOrphan: boolean): void => {
    if (!isOrphan) {
      // Refuse to select used images at the UI layer. The server-side
      // safety check still runs, but blocking here keeps the "N selected"
      // count meaningful for delete.
      toast.info('Only orphan images can be deleted', {
        description: 'Detach the image from its content first.',
      })
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const clearSelection = (): void => setSelected(new Set())

  const orphanUrls = useMemo(() => {
    if (!items || !usedUrls) return []
    return items.filter((i) => !usedUrls.has(i.url)).map((i) => i.url)
  }, [items, usedUrls])

  const doDelete = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return
    setIsDeleting(true)
    try {
      const req: MediaDeleteRequest = { urls }
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string
        }
        throw new Error(body.message ?? `Delete failed (${res.status})`)
      }
      const json = (await res.json()) as MediaDeleteResponse
      if (json.deleted.length > 0) {
        toast.success(
          json.deleted.length === 1
            ? '1 image deleted'
            : `${json.deleted.length} images deleted`,
        )
      }
      if (json.skipped.length > 0) {
        // Show the first reason as the description; more detail would
        // need a modal, which we've deferred.
        const first = json.skipped[0]
        toast.error(
          `${json.skipped.length} image${json.skipped.length > 1 ? 's' : ''} skipped`,
          {
            description:
              first.reason === 'still-referenced'
                ? 'Some images are still linked from a content doc.'
                : first.reason === 'not-in-bucket'
                  ? 'Some images were already gone from the bucket.'
                  : 'Some URLs were not recognized.',
          },
        )
      }
      // Full refresh after delete so both `items` and `usedUrls` are in
      // sync (and selected clears via load's dedupe logic).
      await load()
    } catch (err) {
      toast.error('Delete failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteSelected = async (): Promise<void> => {
    if (selected.size === 0) return
    const n = selected.size
    if (
      !confirm(
        `Delete ${n} image${n > 1 ? 's' : ''}? This removes them from the bucket permanently.`,
      )
    ) {
      return
    }
    await doDelete(Array.from(selected))
  }

  const deleteAllOrphans = async (): Promise<void> => {
    if (orphanUrls.length === 0) return
    if (
      !confirm(
        `Delete all ${orphanUrls.length} orphan images? This removes them from the bucket permanently. Images that got linked since page load will be skipped.`,
      )
    ) {
      return
    }
    await doDelete(orphanUrls)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({items?.length ?? 0})
        </FilterChip>
        <FilterChip
          active={filter === 'used'}
          onClick={() => setFilter('used')}
        >
          Used ({(items?.length ?? 0) - orphanCount})
        </FilterChip>
        <FilterChip
          active={filter === 'orphan'}
          onClick={() => setFilter('orphan')}
        >
          Orphan ({orphanCount})
        </FilterChip>
        <Input
          placeholder="Search filename…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ml-auto w-full max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={isLoading || isDeleting}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void deleteAllOrphans()}
          disabled={isLoading || isDeleting || orphanCount === 0}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete all orphans ({orphanCount})
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Loading…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {items?.length === 0
            ? 'No images in the bucket yet.'
            : 'No images match this filter.'}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => {
            const isOrphan = !usedUrls?.has(item.url)
            return (
              <BrowseCard
                key={item.url}
                item={item}
                isOrphan={isOrphan}
                isSelected={selected.has(item.url)}
                onToggleSelect={() => toggleSelect(item.url, isOrphan)}
              />
            )
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-lg">
          <span className="text-sm font-semibold">
            {selected.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={isDeleting}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void deleteSelected()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete selected
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-muted)] text-[var(--color-ink-2)] hover:bg-[var(--color-border)]'
      }`}
    >
      {children}
    </button>
  )
}

function BrowseCard({
  item,
  isOrphan,
  isSelected,
  onToggleSelect,
}: {
  item: MediaItem
  isOrphan: boolean
  isSelected: boolean
  onToggleSelect: () => void
}) {
  const copyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(item.url)
      toast.success('URL copied')
    } catch {
      toast.error('Copy failed')
    }
  }
  const kb = Math.round(item.sizeBytes / 1024)
  const shortName = item.name.split('/').pop() ?? item.name
  return (
    <Card
      className={`relative flex flex-col overflow-hidden p-0 transition-colors ${
        isSelected ? 'ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      {/* Selection checkbox overlays the thumbnail top-left. Disabled
          look on used images since selecting them is a no-op (the API
          would reject them anyway). */}
      <button
        type="button"
        onClick={onToggleSelect}
        aria-label={isSelected ? 'Deselect image' : 'Select image'}
        title={
          isOrphan
            ? isSelected
              ? 'Deselect'
              : 'Select for delete'
            : 'Only orphan images can be selected'
        }
        className={`absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 shadow ${
          isOrphan ? 'hover:bg-white' : 'opacity-50'
        }`}
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4 text-[var(--color-primary)]" />
        ) : (
          <Square className="h-4 w-4 text-[var(--color-ink-3)]" />
        )}
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className="aspect-square w-full object-cover bg-[var(--color-muted)]"
      />
      <div className="flex flex-col gap-1.5 p-2">
        <div className="flex items-center gap-1">
          {isOrphan ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              <Trash2 className="h-3 w-3" />
              Orphan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
              <CheckCircle2 className="h-3 w-3" />
              Used
            </span>
          )}
          <span className="text-[10px] text-[var(--color-muted-foreground)]">
            {kb} KB
          </span>
        </div>
        <span
          className="truncate text-xs font-semibold"
          title={shortName}
        >
          {shortName}
        </span>
        <span className="text-[10px] text-[var(--color-muted-foreground)]">
          Uploaded {fmtUploadedAt(item.createdAt)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={copyUrl}
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copy URL
        </Button>
      </div>
    </Card>
  )
}
