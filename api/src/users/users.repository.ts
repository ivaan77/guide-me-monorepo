import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FavoriteRef } from '@guide-me-app/core';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  findByClerkId(clerkUserId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ clerkUserId }).lean<UserDocument>().exec();
  }

  // Lazy upsert on first authed request — keeps the user record in sync
  // with Clerk identities without a webhook for v0.
  async upsertByClerkId(clerkUserId: string): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { clerkUserId },
        { $setOnInsert: { clerkUserId, favorites: [] } },
        { new: true, upsert: true },
      )
      .lean<UserDocument>()
      .exec() as Promise<UserDocument>;
  }

  async addFavorite(
    clerkUserId: string,
    fav: FavoriteRef,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { clerkUserId },
        { $addToSet: { favorites: fav } },
        { new: true },
      )
      .lean<UserDocument>()
      .exec();
  }

  async removeFavorite(
    clerkUserId: string,
    fav: FavoriteRef,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { clerkUserId },
        { $pull: { favorites: { type: fav.type, id: fav.id } } },
        { new: true },
      )
      .lean<UserDocument>()
      .exec();
  }

  // Strips a favorite ref from every user. Called when admin deletes the
  // underlying entity so the favorite doesn't linger as an orphan.
  async pullFavoriteFromAll(fav: FavoriteRef): Promise<number> {
    const result = await this.userModel
      .updateMany({}, { $pull: { favorites: { type: fav.type, id: fav.id } } })
      .exec();
    return result.modifiedCount ?? 0;
  }

  // Strips every 'sub-stop' favorite whose composite id starts with the
  // given excursion slug. Called when an excursion is deleted — kills the
  // parent + all of its descendant sub-stop favorites in one update.
  async pullSubStopFavoritesByExcursionSlug(
    excursionSlug: string,
  ): Promise<number> {
    const prefix = `${excursionSlug}:`;
    const result = await this.userModel
      .updateMany(
        {},
        {
          $pull: {
            favorites: {
              type: 'sub-stop',
              id: { $regex: `^${escapeRegex(prefix)}` },
            },
          },
        },
      )
      .exec();
    return result.modifiedCount ?? 0;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
