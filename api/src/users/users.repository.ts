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
}
