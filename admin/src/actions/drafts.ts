'use server'

import {
  type AdminDraftEntry,
  type AdminDraftListResponse,
  type AdminDraftResponse,
  type AdminDraftUpsertRequest,
  AdminPath,
  type DraftEntityType,
} from '@guide-me-app/core'
import { adminApi } from '@/lib/api'

// Server actions for the admin autosave-drafts feature. The forms call
// upsertDraftAction on a 2s debounce; list pages call listDraftsAction
// to render the "unpublished drafts" banner; forms call getDraftAction
// on mount to check for a restorable draft and deleteDraftAction after
// a successful real save.

export async function upsertDraftAction(
  entityType: DraftEntityType,
  slug: string,
  body: AdminDraftUpsertRequest,
): Promise<AdminDraftEntry | null> {
  const res = await adminApi.put<AdminDraftResponse>(
    AdminPath.Drafts.getOne(entityType, slug),
    body,
  )
  return res.draft
}

export async function getDraftAction(
  entityType: DraftEntityType,
  slug: string,
): Promise<AdminDraftEntry | null> {
  const res = await adminApi.get<AdminDraftResponse>(
    AdminPath.Drafts.getOne(entityType, slug),
  )
  return res.draft
}

export async function listDraftsAction(
  entityType: DraftEntityType,
): Promise<AdminDraftEntry[]> {
  const res = await adminApi.get<AdminDraftListResponse>(
    AdminPath.Drafts.getList(entityType),
  )
  return res.drafts
}

export async function deleteDraftAction(
  entityType: DraftEntityType,
  slug: string,
): Promise<void> {
  await adminApi.delete(AdminPath.Drafts.getOne(entityType, slug))
}
