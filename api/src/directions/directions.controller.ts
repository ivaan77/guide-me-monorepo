import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicPath, WalkingDirectionsResponse } from '@guide-me-app/core';
import { DirectionsService } from './directions.service';

@Controller()
export class DirectionsController {
  constructor(private readonly directionsService: DirectionsService) {}

  // 60 requests per minute per IP — generous for human use, blocks scraping.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(PublicPath.Directions.walk)
  async getWalkingRoute(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ): Promise<WalkingDirectionsResponse> {
    const origin = {
      latitude: parseCoord(originLat, 'originLat', -90, 90),
      longitude: parseCoord(originLng, 'originLng', -180, 180),
    };
    const destination = {
      latitude: parseCoord(destLat, 'destLat', -90, 90),
      longitude: parseCoord(destLng, 'destLng', -180, 180),
    };
    return this.directionsService.getWalkingRoute(origin, destination);
  }
}

function parseCoord(
  raw: string,
  name: string,
  min: number,
  max: number,
): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new BadRequestException(`Invalid ${name}: ${raw}`);
  }
  return value;
}
