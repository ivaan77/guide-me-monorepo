import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PublicPath } from '@guide-me-app/core';
import type { PublicWeatherResponse } from '@guide-me-app/core';
import { WeatherService } from './weather.service';

// Basic ISO yyyy-mm-dd validator. Doesn't check for valid calendar dates
// (2026-02-31 slips through) but that's OK — Open-Meteo will reject those
// upstream and we treat the null response gracefully.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@Controller()
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get(PublicPath.Weather.forecast)
  async getForecast(
    @Query('lat') latRaw: string,
    @Query('lng') lngRaw: string,
    @Query('date') date: string,
  ): Promise<PublicWeatherResponse> {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new BadRequestException('Invalid `lat` (must be -90..90).');
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new BadRequestException('Invalid `lng` (must be -180..180).');
    }
    if (!date || !DATE_RE.test(date)) {
      throw new BadRequestException('Invalid `date` (expected yyyy-mm-dd).');
    }

    const weather = await this.weather.getForecast(lat, lng, date);
    if (!weather) {
      // Not found rather than 5xx: the caller should degrade gracefully
      // (show "weather unavailable"), not treat this as a server error.
      throw new NotFoundException(
        'Forecast not available for that location/date.',
      );
    }
    return { weather };
  }
}
