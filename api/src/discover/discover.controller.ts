import { Controller, Get, Headers, Param } from '@nestjs/common';
import {
  AllPublicCitiesResponse,
  PublicCityDetailResponse,
  PublicExcursionResponse,
  PublicPath,
  PublicPlaceResponse,
} from '@guide-me-app/core';
import { DiscoverService } from './discover.service';
import { parseAcceptLanguage } from './locale.util';

@Controller()
export class DiscoverController {
  constructor(private readonly discoverService: DiscoverService) {}

  @Get(PublicPath.Discover.cities)
  async getCities(
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<AllPublicCitiesResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.discoverService.getAllCities(locale);
  }

  @Get(PublicPath.Discover.cityById)
  async getCityById(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicCityDetailResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.discoverService.getCityById(id, locale);
  }

  @Get(PublicPath.Discover.excursionById)
  async getExcursionById(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicExcursionResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.discoverService.getExcursionById(id, locale);
  }

  @Get(PublicPath.Discover.placeById)
  async getPlaceById(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicPlaceResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.discoverService.getPlaceById(id, locale);
  }
}
