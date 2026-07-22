'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { DraftEntityType } from '@guide-me-app/core'
import {
  deleteDraftAction,
  upsertDraftAction,
} from '@/actions/drafts'

// Draft-autosave hook for admin content forms. Watches the whole form,
// PUTs the current values to /admin/drafts/<type>/<slug> after 2s idle,
// exposes a small status object so the caller can render "Saved 12s ago".
//
// The hook DOES NOT auto-restore drafts on mount — the form owns that
// decision, since it may want to show a "you have unsaved changes"
// modal or diff view. See excursion-form.tsx for the restore flow.
//
// Skip cases (no autosave fired):
// - `form.formState.isDirty === false` (nothing edited since load)
// - `slug` empty/undefined (brand-new form, no identity yet)
// - The last-sent snapshot matches the current values (nothing changed)

const AUTOSAVE_DEBOUNCE_MS = 2000

export type DraftStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'error'; message: string }

type Options<TValues extends FieldValues> = {
  entityType: DraftEntityType
  // Stable identity — auto-derived from name.en/title.en in every form.
  // Empty string means "no identity yet, don't autosave."
  slug: string
  isNew: boolean
  form: UseFormReturn<TValues>
  // Called with the final resolved values right before the network PUT
  // fires. Lets callers strip non-serialisable or noise fields. Return
  // the payload to send; return null to skip this save entirely.
  transform?: (values: TValues) => unknown | null
  // Toggle the whole hook off (e.g. during initial data load, or once
  // the user has explicitly saved and unmount is imminent).
  enabled?: boolean
}

export function useDraftAutosave<TValues extends FieldValues>({
  entityType,
  slug,
  isNew,
  form,
  transform,
  enabled = true,
}: Options<TValues>): {
  status: DraftStatus
  clearDraft: () => Promise<void>
  // Mark the given values as the "already saved" baseline WITHOUT
  // hitting the network. Use this right after `form.reset(payload)`
  // when loading a draft into the form — otherwise the watch echo
  // from reset() triggers a redundant autosave that recreates the
  // draft you just consumed.
  markSaved: (values: TValues) => void
} {
  const [status, setStatus] = useState<DraftStatus>({ kind: 'idle' })

  // Refs for values that change often but shouldn't retrigger the watch
  // subscription effect (which would tear down and rebuild it on every
  // form change — hugely wasteful).
  const slugRef = useRef(slug)
  const isNewRef = useRef(isNew)
  const enabledRef = useRef(enabled)
  const transformRef = useRef(transform)
  useEffect(() => {
    slugRef.current = slug
  }, [slug])
  useEffect(() => {
    isNewRef.current = isNew
  }, [isNew])
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // Serialised snapshot of the last successfully sent payload, so we
  // can bail out early when the form re-notifies with the same values.
  const lastSentRef = useRef<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    // Reset the "last sent" snapshot when the slug (identity) changes,
    // so a rename doesn't accidentally short-circuit the first save
    // under the new key.
    lastSentRef.current = null
  }, [slug])

  useEffect(() => {
    // Watch every field. RHF's watch callback fires on every keystroke;
    // we debounce to 2s of idle before actually saving.
    const sub = form.watch((values) => {
      if (!enabledRef.current) return
      const currentSlug = slugRef.current
      if (!currentSlug) return
      if (!form.formState.isDirty) return

      cancelPending()
      timerRef.current = setTimeout(async () => {
        timerRef.current = null
        const transformed = transformRef.current
          ? transformRef.current(values as TValues)
          : (values as unknown)
        if (transformed === null) return
        const snapshot = JSON.stringify(transformed)
        if (snapshot === lastSentRef.current) return

        setStatus({ kind: 'saving' })
        try {
          await upsertDraftAction(entityType, currentSlug, {
            payload: transformed,
            isNew: isNewRef.current,
          })
          lastSentRef.current = snapshot
          setStatus({ kind: 'saved', at: new Date() })
        } catch (err) {
          setStatus({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      }, AUTOSAVE_DEBOUNCE_MS)
    })

    return () => {
      sub.unsubscribe()
      cancelPending()
    }
    // `form` is stable; `entityType` is fixed per mount. Every other
    // reactive input is threaded via refs so this effect runs exactly
    // once for the lifetime of the picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, entityType])

  const clearDraft = useCallback(async () => {
    cancelPending()
    const currentSlug = slugRef.current
    if (!currentSlug) return
    try {
      await deleteDraftAction(entityType, currentSlug)
      // NOTE: we intentionally DO NOT reset lastSentRef here. The
      // dedupe guard should reflect the current form state, not
      // "nothing has ever been sent" — otherwise the next watch
      // echo would recreate the draft we just deleted. Callers that
      // want the guard seeded (e.g. after form.reset) should call
      // `markSaved(newValues)` explicitly.
      setStatus({ kind: 'idle' })
    } catch {
      // Non-fatal — the TTL will clean up eventually.
    }
  }, [entityType, cancelPending])

  const markSaved = useCallback(
    (values: TValues) => {
      cancelPending()
      const transformed = transformRef.current
        ? transformRef.current(values)
        : (values as unknown)
      lastSentRef.current =
        transformed === null ? null : JSON.stringify(transformed)
      setStatus({ kind: 'idle' })
    },
    [cancelPending],
  )

  return { status, clearDraft, markSaved }
}
