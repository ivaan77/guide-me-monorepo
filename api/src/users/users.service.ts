import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FavoriteRef,
  MeResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
} from '@guide-me-app/core';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async getOrCreate(clerkUserId: string): Promise<MeResponse> {
    const user = await this.repo.upsertByClerkId(clerkUserId);
    return this.toMeResponse(user);
  }

  async addFavorite(
    clerkUserId: string,
    fav: FavoriteRef,
  ): Promise<AddFavoriteResponse> {
    await this.repo.upsertByClerkId(clerkUserId);
    const user = await this.repo.addFavorite(clerkUserId, fav);
    if (!user) throw new NotFoundException('User not found.');
    return { favorites: user.favorites };
  }

  async removeFavorite(
    clerkUserId: string,
    fav: FavoriteRef,
  ): Promise<RemoveFavoriteResponse> {
    const user = await this.repo.removeFavorite(clerkUserId, fav);
    if (!user) throw new NotFoundException('User not found.');
    return { favorites: user.favorites };
  }

  private toMeResponse(user: UserDocument): MeResponse {
    return {
      clerkUserId: user.clerkUserId,
      favorites: user.favorites,
      createdAt: (
        (user as unknown as { createdAt: Date }).createdAt ?? new Date()
      ).toISOString(),
      updatedAt: (
        (user as unknown as { updatedAt: Date }).updatedAt ?? new Date()
      ).toISOString(),
    };
  }
}
