'use client'

import { useEffect, useState } from 'react'
import { CircleCheck, CircleDashed, CircleX, Loader2 } from 'lucide-react'
import type { DraftStatus } from '@/hooks/use-draft-autosave'

// Small inline status indicator next to the form's Save button. Reads
// the status object exposed by useDraftAutosave and reformats "saved
// at" into a rolling relative time (e.g. "saved 12s ago") that ticks
// once per second while the tab is visible.

function formatRelative(from: Date, now: Date): string {
  const secs = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000))
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function DraftBadge({ status }: { status: DraftStatus }) {
  // Refresh once a second so the "Xs ago" ticks up without user input.
  // The tick effect only runs while we have a saved timestamp to
  // display — idle/saving/error states don't need a timer.
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    if (status.kind !== 'saved') return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [status.kind])

  if (status.kind === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
        <CircleDashed className="h-3 w-3" />
        Draft autosave ready
      </span>
    )
  }
  if (status.kind === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving draft…
      </span>
    )
  }
  if (status.kind === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
        <CircleCheck className="h-3 w-3" />
        Draft saved {formatRelative(status.at, now)}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium text-red-700"
      title={status.message}
    >
      <CircleX className="h-3 w-3" />
      Draft save failed
    </span>
  )
}
