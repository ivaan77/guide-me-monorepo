import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RatingTargetType, RatingValue } from '@guide-me-app/core';

// One document per (user, entity) rating. When the user deletes their
// account, `clerkUserId` is set to null (see ratings.repository.ts →
// anonymizeByClerkId). Anonymized rows keep the rating value so aggregates
// remain accurate — the user's identity is severed, the vote persists.
@Schema({ collection: 'ratings', timestamps: true })
export class Rating {
  // Nullable: null == anonymized. The partial unique index below enforces
  // "one rating per user per target" only while clerkUserId is a string.
  @Prop({ type: String, default: null, required: false })
  clerkUserId!: string | null;

  @Prop({
    type: String,
    required: true,
    enum: ['city', 'excursion', 'place'],
  })
  targetType!: RatingTargetType;

  // Entity slug (same convention as favorites).
  @Prop({ type: String, required: true })
  targetId!: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  value!: RatingValue;
}

export type RatingDocument = HydratedDocument<Rating>;
export const RatingSchema = SchemaFactory.createForClass(Rating);

// Partial unique index — enforces "one rating per user per entity" while
// the user still exists. Anonymized rows (clerkUserId: null) skip this
// constraint, so many `null` orphans can coexist for the same target.
RatingSchema.index(
  { clerkUserId: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    partialFilterExpression: { clerkUserId: { $type: 'string' } },
  },
);

// Read-side index used by aggregate recomputation + user's own rating
// lookup on /me hydration.
RatingSchema.index({ targetType: 1, targetId: 1 });
