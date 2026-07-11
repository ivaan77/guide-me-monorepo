import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { RatingTargetType, RatingValue } from '@guide-me-app/core';
import { Rating, RatingDocument } from './schemas/rating.schema';

export type RatingIdentifier = {
  clerkUserId: string;
  targetType: RatingTargetType;
  targetId: string;
};

@Injectable()
export class RatingsRepository {
  constructor(
    @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
  ) {}

  // Upsert a rating and return the previous value (or null if this is the
  // user's first rating for this target). The service uses this to compute
  // the aggregate delta atomically inside a transaction.
  async upsertReturningPrev(
    ref: RatingIdentifier,
    value: RatingValue,
    session?: ClientSession,
  ): Promise<number | null> {
    const prev = await this.ratingModel
      .findOneAndUpdate(
        {
          clerkUserId: ref.clerkUserId,
          targetType: ref.targetType,
          targetId: ref.targetId,
        },
        { $set: { value } },
        { new: false, upsert: true, session },
      )
      .lean<RatingDocument>()
      .exec();
    // findOneAndUpdate with new:false returns the pre-update doc — null on
    // the insert branch, so a null return means "no previous rating".
    return prev?.value ?? null;
  }

  // Remove a rating and return the value that was removed (or null if no
  // rating existed). Used by the service to decrement the aggregate.
  async removeReturningValue(
    ref: RatingIdentifier,
    session?: ClientSession,
  ): Promise<number | null> {
    const removed = await this.ratingModel
      .findOneAndDelete(
        {
          clerkUserId: ref.clerkUserId,
          targetType: ref.targetType,
          targetId: ref.targetId,
        },
        { session },
      )
      .lean<RatingDocument>()
      .exec();
    return removed?.value ?? null;
  }

  // All ratings owned by one user — hydrated into /me so mobile can
  // pre-select the user's stars on detail screens.
  async findByClerkId(clerkUserId: string): Promise<RatingDocument[]> {
    return this.ratingModel
      .find({ clerkUserId })
      .lean<RatingDocument[]>()
      .exec();
  }

  // Sever every rating that belonged to this user by nulling clerkUserId.
  // Aggregates on target entities are NOT touched — the votes remain
  // counted; only the identity is severed. Called from the delete-account
  // flow before the user doc itself is removed.
  async anonymizeByClerkId(clerkUserId: string): Promise<number> {
    const result = await this.ratingModel
      .updateMany({ clerkUserId }, { $set: { clerkUserId: null } })
      .exec();
    return result.modifiedCount ?? 0;
  }

  // Recomputes the aggregate for a single target from raw ratings. Used by
  // the backfill script and as a self-heal in case entity aggregates ever
  // drift from truth.
  async computeAggregate(
    targetType: RatingTargetType,
    targetId: string,
  ): Promise<{ sum: number; count: number }> {
    const [result] = await this.ratingModel
      .aggregate<{ sum: number; count: number }>([
        { $match: { targetType, targetId } },
        {
          $group: {
            _id: null,
            sum: { $sum: '$value' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    return result ?? { sum: 0, count: 0 };
  }

  // Global aggregate across EVERY rating in the collection. Feeds the
  // public web "average rating across all tours" counter. Includes
  // anonymized rows (clerkUserId=null) — the average reflects reality,
  // not just currently-active users.
  async computeGlobalAggregate(): Promise<{ sum: number; count: number }> {
    const [result] = await this.ratingModel
      .aggregate<{ sum: number; count: number }>([
        {
          $group: {
            _id: null,
            sum: { $sum: '$value' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    return result ?? { sum: 0, count: 0 };
  }
}
