import {
  Controller,
  Get,
  Headers,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import {
  AllPublicCitiesResponse,
  PublicCityDetailResponse,
  PublicExcursionResponse,
  PublicGalleryResponse,
  PublicPath,
  PublicPlaceResponse,
  PublicStatsResponse,
} from '@guide-me-app/core';
import { DiscoverCacheInterceptor } from './discover.interceptor';
import { DiscoverService } from './discover.service';
import { parseAcceptLanguage } from './locale.util';

@Controller()
@UseInterceptors(DiscoverCacheInterceptor)
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

  // Both web endpoints below produce locale-agnostic payloads (English-only
  // strings for the marketing site). The DiscoverCacheInterceptor keys by
  // request.path + accept-language, so identical responses may be stored
  // once per requested locale — accepted for a couple hundred bytes of
  // extra RAM; keeps the interceptor generic.

  @Get(PublicPath.Web.stats)
  async getWebStats(): Promise<PublicStatsResponse> {
    return this.discoverService.getWebStats();
  }

  @Get(PublicPath.Web.gallery)
  async getWebGallery(): Promise<PublicGalleryResponse> {
    return this.discoverService.getWebGallery();
  }
}
