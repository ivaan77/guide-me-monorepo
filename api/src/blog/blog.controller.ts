import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import {
  BLOG_CATEGORIES,
  type BlogCategory,
  type PublicBlogDetailResponse,
  type PublicBlogListResponse,
  PublicPath,
} from '@guide-me-app/core';
import { parseAcceptLanguage } from '../discover/locale.util';
import { BlogService } from './blog.service';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
// Slug shape mirrors the admin DTO / discover schemas. If the caller
// passes anything else in ?city= we reject to keep the query filter safe
// against injection-shaped strings.
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

@Controller()
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get(PublicPath.Blog.list)
  async list(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicBlogListResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    let cat: BlogCategory | undefined;
    if (category) {
      if (!(BLOG_CATEGORIES as readonly string[]).includes(category)) {
        throw new BadRequestException(`Unknown category: ${category}`);
      }
      cat = category as BlogCategory;
    }
    let citySlug: string | undefined;
    if (city) {
      if (!SLUG_REGEX.test(city)) {
        throw new BadRequestException(`Invalid city slug: ${city}`);
      }
      citySlug = city;
    }
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(limitRaw) || DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;
    return this.blog.listPublished(locale, {
      category: cat,
      citySlug,
      limit,
      skip,
    });
  }

  @Get(PublicPath.Blog.postBySlug)
  async getBySlug(
    @Param('slug') slug: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicBlogDetailResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.blog.getPublishedBySlug(slug, locale);
  }

  // Preview endpoint. Guarded by a per-post random token, so URLs are
  // shareable-safe (like an unlisted YouTube link) — anyone with the URL
  // can read the draft, but you have to be given the URL by an admin.
  // Returns 404 on missing/mismatched token to avoid disclosing which
  // slugs exist as drafts.
  @Get(PublicPath.Blog.previewBySlug)
  async getPreview(
    @Param('slug') slug: string,
    @Query('token') token?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicBlogDetailResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.blog.getPreviewBySlug(slug, token ?? '', locale);
  }
}
