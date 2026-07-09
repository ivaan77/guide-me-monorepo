import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import {
  PublicRatingAggregate,
  RateResponse,
  RatingTargetType,
  RatingValue,
  RemoveRatingResponse,
} from '@guide-me-app/core';
import { DiscoverCity } from '../discover/schemas/discover-city.schema';
import { DiscoverExcursion } from '../discover/schemas/discover-excursion.schema';
import { DiscoverPlace } from '../discover/schemas/discover-place.schema';
import { RatingsRepository } from './ratings.repository';

@Injectable()
export class RatingsService {
  constructor(
    private readonly repo: RatingsRepository,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(DiscoverCity.name)
    private readonly cityModel: Model<DiscoverCity>,
    @InjectModel(DiscoverExcursion.name)
    private readonly excursionModel: Model<DiscoverExcursion>,
    @InjectModel(DiscoverPlace.name)
    private readonly placeModel: Model<DiscoverPlace>,
  ) {}

  // Upsert a rating. Wrapped in a transaction so the raw rating write and
  // the aggregate delta on the target entity commit together — otherwise
  // aggregates drift from truth if the second step fails. Returns the new
  // rating + fresh aggregate for the target so mobile can update its cache
  // for both the star picker and the "★ 4.3 · 127" badge.
  async rate(
    clerkUserId: string,
    targetType: RatingTargetType,
    targetId: string,
    value: RatingValue,
  ): Promise<RateResponse> {
    await this.assertTargetExists(targetType, targetId);

    const session = await this.connection.startSession();
    try {
      const aggregate = await session.withTransaction(async () => {
        const prev = await this.repo.upsertReturningPrev(
          { clerkUserId, targetType, targetId },
          value,
          session,
        );
        // Delta math: first rating (prev === null) bumps count by 1 and sum
        // by the new value. Update overwrites — sum shifts by (new - prev),
        // count is unchanged.
        const sumDelta = prev === null ? value : value - prev;
        const countDelta = prev === null ? 1 : 0;
        return this.bumpEntityAggregate(
          targetType,
          targetId,
          sumDelta,
          countDelta,
          session,
        );
      });
      return {
        rating: { targetType, targetId, value },
        aggregate: aggregate ?? { avg: null, count: 0 },
      };
    } finally {
      await session.endSession();
    }
  }

  // Remove a user's rating. No-op response if they had no rating (the
  // aggregate is returned as-is so mobile can still refresh its cache).
  async unrate(
    clerkUserId: string,
    targetType: RatingTargetType,
    targetId: string,
  ): Promise<RemoveRatingResponse> {
    await this.assertTargetExists(targetType, targetId);

    const session = await this.connection.startSession();
    try {
      const aggregate = await session.withTransaction(async () => {
        const prev = await this.repo.removeReturningValue(
          { clerkUserId, targetType, targetId },
          session,
        );
        if (prev === null) {
          // Nothing to remove — return current aggregate untouched. Use a
          // no-op update so we still get the fresh doc in the response.
          return this.bumpEntityAggregate(targetType, targetId, 0, 0, session);
        }
        return this.bumpEntityAggregate(
          targetType,
          targetId,
          -prev,
          -1,
          session,
        );
      });
      return { aggregate: aggregate ?? { avg: null, count: 0 } };
    } finally {
      await session.endSession();
    }
  }

  // Called from users.service.deleteAccount BEFORE the user doc is deleted.
  // Sets clerkUserId=null on every rating owned by this user — the rating
  // values themselves (and the aggregates already computed from them) stay
  // as-is. No transaction: aggregates are unchanged either way.
  async anonymizeUserRatings(clerkUserId: string): Promise<number> {
    return this.repo.anonymizeByClerkId(clerkUserId);
  }

  private async assertTargetExists(
    targetType: RatingTargetType,
    targetId: string,
  ): Promise<void> {
    const model = this.modelFor(targetType);
    const exists = await model
      .exists({ slug: targetId, isEnabled: true })
      .exec();
    if (!exists) {
      throw new NotFoundException(
        `${targetType} '${targetId}' not found or disabled.`,
      );
    }
  }

  // Returns the Mongoose model for the target type. Typed as `Model<any>`
  // because the three entity models don't share a base type (their shapes
  // diverge) and Mongoose's Model type is invariant. We only ever call
  // slug-based reads/writes that all three schemas support, so the widening
  // is safe.
  private modelFor(targetType: RatingTargetType): Model<any> {
    switch (targetType) {
      case 'city':
        return this.cityModel;
      case 'excursion':
        return this.excursionModel;
      case 'place':
        return this.placeModel;
      default:
        throw new BadRequestException(`Unknown target type: ${targetType}`);
    }
  }

  // Applies delta to ratingSum / ratingCount on the target entity and
  // returns the post-update aggregate. When both deltas are zero, this
  // still returns the current aggregate (used by unrate's no-op branch).
  private async bumpEntityAggregate(
    targetType: RatingTargetType,
    targetId: string,
    sumDelta: number,
    countDelta: number,
    session: ClientSession,
  ): Promise<PublicRatingAggregate | null> {
    const model = this.modelFor(targetType);
    const filter = { slug: targetId };
    const update =
      sumDelta === 0 && countDelta === 0
        ? {}
        : { $inc: { ratingSum: sumDelta, ratingCount: countDelta } };
    const doc = await model
      .findOneAndUpdate(filter, update, { new: true, session })
      .select('ratingSum ratingCount')
      .lean<{ ratingSum?: number; ratingCount?: number }>()
      .exec();
    if (!doc) return null;
    const sum = doc.ratingSum ?? 0;
    const count = doc.ratingCount ?? 0;
    if (count === 0) return { avg: 0, count: 0 };
    return { avg: roundTo1(sum / count), count };
  }
}

function roundTo1(n: number): number {
  return Math.round(n * 10) / 10;
}
