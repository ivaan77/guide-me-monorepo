import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

// Draft autosave storage. One row per (entityType, slug, authorId) — the
// admin form autosaves the whole form payload here every couple seconds
// while the user edits, so an accidental back-nav or tab close doesn't
// lose their work.
//
// - `payload` is a Mixed blob (whatever the form's zod schema shape is,
//   half-valid, no server-side validation). The admin app owns the shape.
// - `authorId` is currently always `'admin'` (single shared account) but
//   the schema is ready for per-user auth.
// - `slug` is the entity's stable identity (auto-derived from name.en /
//   title.en client-side). Empty until the user types a name, so brand-
//   new drafts don't autosave until there's something to key them on.
// - `isNew` flags a draft whose entity hasn't been created yet, so the
//   list-page banner can distinguish "unpublished new item" from
//   "unsaved edits to an existing item".
// - TTL: 30 days of inactivity; MongoDB expires the row automatically.

export const DRAFT_ENTITY_TYPES = [
  'excursion',
  'place',
  'city',
  'blog',
] as const;
export type DraftEntityType = (typeof DRAFT_ENTITY_TYPES)[number];

@Schema({ collection: 'admin_drafts', timestamps: true })
export class AdminDraft {
  @Prop({ required: true, enum: DRAFT_ENTITY_TYPES, index: true })
  entityType: DraftEntityType;

  @Prop({ required: true, index: true })
  slug: string;

  @Prop({ required: true, default: 'admin', index: true })
  authorId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload: unknown;

  @Prop({ required: true, default: false })
  isNew: boolean;
}

export type AdminDraftDocument = HydratedDocument<AdminDraft>;
export const AdminDraftSchema = SchemaFactory.createForClass(AdminDraft);

// Unique per (author, entityType, slug) so upserts are deterministic.
AdminDraftSchema.index(
  { authorId: 1, entityType: 1, slug: 1 },
  { unique: true },
);

// TTL: expire drafts 30 days after their last write. `timestamps: true`
// keeps `updatedAt` fresh on every upsert; the TTL monitor drops the row
// once it stops being touched.
AdminDraftSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);
