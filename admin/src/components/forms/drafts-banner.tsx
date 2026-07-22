'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { CircleDashed, Pencil, Plus, X } from 'lucide-react'
import type { DraftEntityType } from '@guide-me-app/core'
import { useRouter } from 'next/navigation'
import { deleteDraftAction } from '@/actions/drafts'
import { Button } from '@/components/ui/button'

// List-page banner surfacing autosaved drafts for a content type.
// Renders two logical groups when both are non-empty:
//   • New drafts (isNew: true)  → items the user started but never saved
//   • Edit drafts (isNew: false) → unsaved changes on already-published items
// Each row links to the appropriate form URL and has a small "discard" X.
//
// Rows are precomputed on the server (page.tsx) so this client component
// receives only serialisable strings — functions can't cross the RSC
// boundary. Each page's page.tsx extracts label + href for its entity.

export type DraftBannerRow = {
  slug: string
  isNew: boolean
  label: string
  href: string
  updatedAt: string
}

type Props = {
  entityType: DraftEntityType
  rows: DraftBannerRow[]
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function DraftsBanner({ entityType, rows }: Props) {
  const router = useRouter()
  // Local optimistic removal so the row disappears immediately on
  // Discard, without waiting for a full page refresh.
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [busySlug, setBusySlug] = useState<string | null>(null)

  const visible = rows.filter((r) => !hidden.has(r.slug))
  if (visible.length === 0) return null

  const newRows = visible.filter((r) => r.isNew)
  const editRows = visible.filter((r) => !r.isNew)

  const discard = async (slug: string) => {
    setBusySlug(slug)
    try {
      await deleteDraftAction(entityType, slug)
      setHidden((prev) => {
        const next = new Set(prev)
        next.add(slug)
        return next
      })
      toast.success('Draft discarded')
      // Refresh in the background so the server-side props stay in sync
      // (e.g. if we navigate elsewhere and back).
      router.refresh()
    } catch (err) {
      toast.error('Discard failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
        <CircleDashed className="h-3.5 w-3.5" />
        Autosaved drafts ({visible.length})
      </p>
      <ul className="flex flex-col gap-1">
        {newRows.map((r) => (
          <DraftRow
            key={`new-${r.slug}`}
            icon={<Plus className="h-3.5 w-3.5 text-amber-800" />}
            label={r.label}
            slug={r.slug}
            savedAt={r.updatedAt}
            href={r.href}
            isBusy={busySlug === r.slug}
            onDiscard={() => void discard(r.slug)}
          />
        ))}
        {editRows.map((r) => (
          <DraftRow
            key={`edit-${r.slug}`}
            icon={<Pencil className="h-3.5 w-3.5 text-amber-800" />}
            label={r.label}
            slug={r.slug}
            savedAt={r.updatedAt}
            href={r.href}
            isBusy={busySlug === r.slug}
            onDiscard={() => void discard(r.slug)}
          />
        ))}
      </ul>
    </div>
  )
}

function DraftRow({
  icon,
  label,
  slug,
  savedAt,
  href,
  isBusy,
  onDiscard,
}: {
  icon: React.ReactNode
  label: string
  slug: string
  savedAt: string
  href: string
  isBusy: boolean
  onDiscard: () => void
}) {
  return (
    <li className="flex items-center gap-2 rounded bg-white/60 px-2 py-1.5 text-sm">
      {icon}
      <Link
        href={href}
        className="flex-1 min-w-0 truncate font-medium text-amber-950 hover:underline"
      >
        {label || <span className="italic text-amber-800">Untitled</span>}
      </Link>
      <span className="hidden sm:inline text-[10px] font-mono text-amber-800">
        {slug}
      </span>
      <span className="text-[10px] text-amber-800">
        {formatRelative(savedAt)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDiscard}
        disabled={isBusy}
        title="Discard draft"
        className="h-6 w-6 text-amber-800 hover:bg-amber-100"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </li>
  )
}
