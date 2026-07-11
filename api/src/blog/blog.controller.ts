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

@Controller()
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get(PublicPath.Blog.list)
  async list(
    @Query('category') category?: string,
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
    const page = Math.max(1, Number(pageRaw) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(limitRaw) || DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;
    return this.blog.listPublished(locale, { category: cat, limit, skip });
  }

  @Get(PublicPath.Blog.postBySlug)
  async getBySlug(
    @Param('slug') slug: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicBlogDetailResponse> {
    const locale = parseAcceptLanguage(acceptLanguage);
    return this.blog.getPublishedBySlug(slug, locale);
  }
}
