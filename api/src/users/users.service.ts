import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FavoriteRef,
  MeResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
} from '@guide-me-app/core';
import { DiscoverRepository } from '../discover/discover.repository';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly discoverRepo: DiscoverRepository,
  ) {}

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
    const favorites = await this.resolveFavorites(user.favorites);
    return { favorites };
  }

  async removeFavorite(
    clerkUserId: string,
    fav: FavoriteRef,
  ): Promise<RemoveFavoriteResponse> {
    const user = await this.repo.removeFavorite(clerkUserId, fav);
    if (!user) throw new NotFoundException('User not found.');
    const favorites = await this.resolveFavorites(user.favorites);
    return { favorites };
  }

  // Drops favorites whose target entity is disabled (`isEnabled: false`) or
  // missing from mongo. The stored array on the user is left untouched —
  // re-enabling the entity restores the favorite on the next read. Hard
  // orphans (entity deleted) are cleaned up by a separate one-shot script.
  private async resolveFavorites(
    favorites: FavoriteRef[],
  ): Promise<FavoriteRef[]> {
    if (favorites.length === 0) return [];

    const citySlugs: string[] = [];
    const excursionSlugs: string[] = [];
    const placeSlugs: string[] = [];
    for (const fav of favorites) {
      if (fav.type === 'city') citySlugs.push(fav.id);
      else if (fav.type === 'excursion') excursionSlugs.push(fav.id);
      else if (fav.type === 'place') placeSlugs.push(fav.id);
    }

    const [cities, excursions, places] = await Promise.all([
      this.discoverRepo.findEnabledCitiesBySlugs(citySlugs),
      this.discoverRepo.findEnabledExcursionsBySlugs(excursionSlugs),
      this.discoverRepo.findEnabledPlacesBySlugs(placeSlugs),
    ]);

    const enabledCity = new Set(cities.map((c) => c.slug));
    const enabledExcursion = new Set(excursions.map((e) => e.slug));
    const enabledPlace = new Set(places.map((p) => p.slug));

    return favorites.filter((fav) => {
      if (fav.type === 'city') return enabledCity.has(fav.id);
      if (fav.type === 'excursion') return enabledExcursion.has(fav.id);
      if (fav.type === 'place') return enabledPlace.has(fav.id);
      return false;
    });
  }

  private async toMeResponse(user: UserDocument): Promise<MeResponse> {
    const favorites = await this.resolveFavorites(user.favorites);
    return {
      clerkUserId: user.clerkUserId,
      favorites,
      createdAt: (
        (user as unknown as { createdAt: Date }).createdAt ?? new Date()
      ).toISOString(),
      updatedAt: (
        (user as unknown as { updatedAt: Date }).updatedAt ?? new Date()
      ).toISOString(),
    };
  }
}
