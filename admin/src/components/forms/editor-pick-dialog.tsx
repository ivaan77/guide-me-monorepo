'use client'

import { useEffect, useState } from 'react'
import type { EditorPickAttrs, EditorPickVariant } from '@guide-me-app/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Small modal for authoring a Tip / Highlight card. Opens with variant
// preselected by the toolbar button the author clicked. Title + body
// are plain strings — if we ever need marks inside, we can upgrade the
// body field to a nested TipTap editor without changing the stored
// attrs shape (body would become a TipTapDoc string).

type Props = {
  open: boolean
  variant: EditorPickVariant
  onClose: () => void
  onSave: (attrs: EditorPickAttrs) => void
}

const VARIANT_LABEL: Record<EditorPickVariant, string> = {
  tip: 'Tip',
  highlight: 'Highlight',
}

const VARIANT_HINT: Record<EditorPickVariant, string> = {
  tip: 'Practical suggestion for the reader (amber on web + app).',
  highlight: 'Important context or callout (blue on web + app).',
}

export function EditorPickDialog({ open, variant, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // Clear the fields whenever the dialog opens so the last insert doesn't
  // bleed into the next one. Only fires on open transition — closing +
  // reopening for the same variant resets, which is what authors want.
  useEffect(() => {
    if (open) {
      setTitle('')
      setBody('')
    }
  }, [open])

  if (!open) return null

  const canSave = title.trim().length > 0 && body.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold">Insert {VARIANT_LABEL[variant]}</h2>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {VARIANT_HINT[variant]}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ep-title">Title *</Label>
          <Input
            id="ep-title"
            placeholder="Book Sunday brunch two days ahead"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ep-body">Body *</Label>
          <Textarea
            id="ep-body"
            placeholder="Zagreb brunch spots fill up fast on weekends — locals reserve their favorite tables mid-week."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              onSave({
                variant,
                title: title.trim(),
                body: body.trim(),
              })
              onClose()
            }}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  )
}
