// Draft autosave shared types. The admin app posts form values to the
// backend every couple seconds while an editor is typing, so back-nav
// or tab close doesn't lose work. `payload` is intentionally `unknown`
// — schemas differ per entity type, and drafts are exempt from
// validation so half-finished forms save fine.

export const DRAFT_ENTITY_TYPES = [
    'excursion',
    'place',
    'city',
    'blog',
] as const

export type DraftEntityType = (typeof DRAFT_ENTITY_TYPES)[number]

export type AdminDraftEntry = {
    entityType: DraftEntityType
    slug: string
    authorId: string
    // The full form values as a serialisable blob. Consumers (the admin
    // form on restore) know the concrete shape for their entity type.
    payload: unknown
    // True when the entity doesn't exist yet in prod — a brand-new item
    // the user started creating and abandoned. False for edits on
    // already-published entities. Used by the list-page banner to
    // distinguish "unpublished draft" vs "unsaved edits" affordances.
    isNew: boolean
    // ISO timestamp of the last autosave write. Powers the "last saved
    // Xs ago" badge and the list-page "edited 2h ago" hint.
    updatedAt: string
}

export type AdminDraftUpsertRequest = {
    payload: unknown
    isNew: boolean
}

export type AdminDraftResponse = {
    draft: AdminDraftEntry | null
}

export type AdminDraftListResponse = {
    drafts: AdminDraftEntry[]
}
