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
  //
  // 'sub-stop' favorites use a composite id `excursionSlug:stopSlug:subStopSlug`.
  // We bulk-fetch the parent excursions, then walk into stops + subStops
  // for each fav to verify all three layers still exist.
  private async resolveFavorites(
    favorites: FavoriteRef[],
  ): Promise<FavoriteRef[]> {
    if (favorites.length === 0) return [];

    const citySlugs: string[] = [];
    const excursionSlugs: string[] = [];
    const placeSlugs: string[] = [];
    const subStopExcursionSlugs = new Set<string>();
    for (const fav of favorites) {
      if (fav.type === 'city') citySlugs.push(fav.id);
      else if (fav.type === 'excursion') excursionSlugs.push(fav.id);
      else if (fav.type === 'place') placeSlugs.push(fav.id);
      else if (fav.type === 'sub-stop') {
        const parts = fav.id.split(':');
        if (parts.length === 3) subStopExcursionSlugs.add(parts[0]);
      }
    }

    const [cities, excursions, places, subStopExcursions] = await Promise.all([
      this.discoverRepo.findEnabledCitiesBySlugs(citySlugs),
      this.discoverRepo.findEnabledExcursionsBySlugs(excursionSlugs),
      this.discoverRepo.findEnabledPlacesBySlugs(placeSlugs),
      this.discoverRepo.findEnabledExcursionsBySlugs(
        Array.from(subStopExcursionSlugs),
      ),
    ]);

    const enabledCity = new Set(cities.map((c) => c.slug));
    const enabledExcursion = new Set(excursions.map((e) => e.slug));
    const enabledPlace = new Set(places.map((p) => p.slug));

    // Build a lookup: excursionSlug → Map<stopSlug, Set<subStopSlug>>
    const subStopLookup = new Map<string, Map<string, Set<string>>>();
    for (const ex of subStopExcursions) {
      const stopMap = new Map<string, Set<string>>();
      for (const stop of ex.stops ?? []) {
        const subs = new Set<string>((stop.subStops ?? []).map((s) => s.slug));
        stopMap.set(stop.slug, subs);
      }
      subStopLookup.set(ex.slug, stopMap);
    }

    return favorites.filter((fav) => {
      if (fav.type === 'city') return enabledCity.has(fav.id);
      if (fav.type === 'excursion') return enabledExcursion.has(fav.id);
      if (fav.type === 'place') return enabledPlace.has(fav.id);
      if (fav.type === 'sub-stop') {
        const parts = fav.id.split(':');
        if (parts.length !== 3) return false;
        const [exSlug, stopSlug, subSlug] = parts;
        const stops = subStopLookup.get(exSlug);
        if (!stops) return false;
        const subs = stops.get(stopSlug);
        if (!subs) return false;
        return subs.has(subSlug);
      }
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
