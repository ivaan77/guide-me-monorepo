import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  AdminDraftEntry,
  AdminDraftListResponse,
  AdminDraftResponse,
  AdminDraftUpsertRequest,
  DraftEntityType,
} from '@guide-me-app/core';
import { AdminDraft } from './admin-draft.schema';

// One admin account today (`authorId = 'admin'`), so we hardcode it in the
// controller when calling into the service. Kept as a parameter here so
// the day per-user auth lands, only the controller changes.

@Injectable()
export class AdminDraftService {
  constructor(
    @InjectModel(AdminDraft.name)
    private readonly model: Model<AdminDraft>,
  ) {}

  async upsert(
    entityType: DraftEntityType,
    slug: string,
    authorId: string,
    body: AdminDraftUpsertRequest,
  ): Promise<AdminDraftResponse> {
    // findOneAndUpdate with upsert:true is atomic and honours the
    // unique index on (authorId, entityType, slug). setDefaultsOnInsert
    // ensures createdAt is stamped on brand-new drafts.
    const doc = await this.model.findOneAndUpdate(
      { authorId, entityType, slug },
      {
        $set: {
          payload: body.payload,
          isNew: body.isNew,
        },
        $setOnInsert: {
          authorId,
          entityType,
          slug,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { draft: this.toEntry(doc) };
  }

  async getOne(
    entityType: DraftEntityType,
    slug: string,
    authorId: string,
  ): Promise<AdminDraftResponse> {
    const doc = await this.model.findOne({ authorId, entityType, slug });
    return { draft: doc ? this.toEntry(doc) : null };
  }

  async listByType(
    entityType: DraftEntityType,
    authorId: string,
  ): Promise<AdminDraftListResponse> {
    // Newest-first so the banner shows the most-recently-edited draft on
    // top. Small volume (a handful of drafts per author) — no pagination.
    const docs = await this.model
      .find({ authorId, entityType })
      .sort({ updatedAt: -1 });
    return { drafts: docs.map((d) => this.toEntry(d)) };
  }

  async remove(
    entityType: DraftEntityType,
    slug: string,
    authorId: string,
  ): Promise<void> {
    await this.model.deleteOne({ authorId, entityType, slug });
  }

  // Mongoose docs have `updatedAt` from the `timestamps: true` option but
  // it isn't in the Prop-decorated class shape. Cast to a small shape
  // rather than pulling in the full HydratedDocument type here.
  private toEntry(doc: AdminDraft & { updatedAt?: Date }): AdminDraftEntry {
    return {
      entityType: doc.entityType,
      slug: doc.slug,
      authorId: doc.authorId,
      payload: doc.payload,
      isNew: doc.isNew,
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }
}
