import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BlogCategory,
  Locale,
  LocalizedRichText,
  PublicBlogDetailResponse,
  PublicBlogListResponse,
  PublicBlogSummary,
  TipTapDoc,
} from '@guide-me-app/core';
import { pickLocalized, pickLocalizedRichText } from '../discover/locale.util';
import { BlogRepository } from './blog.repository';
import type { BlogDocument } from './schemas/blog.schema';
import { tiptapReadingMinutes } from './tiptap-utils';

@Injectable()
export class BlogService {
  constructor(private readonly repo: BlogRepository) {}

  async listPublished(
    locale: Locale,
    opts: { category?: BlogCategory; limit: number; skip: number },
  ): Promise<PublicBlogListResponse> {
    const { posts, total } = await this.repo.findPublished(opts);
    return {
      posts: posts.map((p) => this.toSummary(p, locale)),
      total,
      locale,
    };
  }

  async getPublishedBySlug(
    slug: string,
    locale: Locale,
  ): Promise<PublicBlogDetailResponse> {
    const doc = await this.repo.findPublishedBySlug(slug);
    if (!doc) throw new NotFoundException(`Blog post not found: ${slug}`);
    const body = pickLocalizedRichText(
      doc.body as unknown as LocalizedRichText,
      locale,
    );
    return {
      post: {
        ...this.toSummary(doc, locale, body),
        body,
        metaTitle: doc.metaTitle
          ? pickLocalized(doc.metaTitle, locale)
          : undefined,
        metaDescription: doc.metaDescription
          ? pickLocalized(doc.metaDescription, locale)
          : undefined,
        ogImage: doc.ogImage,
      },
      locale,
    };
  }

  // Shared summary projection. When the caller has already resolved the
  // body (in getPublishedBySlug), we pass it in so reading-time isn't
  // recalculated from scratch.
  private toSummary(
    doc: BlogDocument,
    locale: Locale,
    resolvedBody?: TipTapDoc,
  ): PublicBlogSummary {
    const body =
      resolvedBody ??
      pickLocalizedRichText(doc.body as unknown as LocalizedRichText, locale);
    return {
      slug: doc.slug,
      category: doc.category,
      title: pickLocalized(doc.title, locale),
      excerpt: pickLocalized(doc.excerpt, locale),
      coverImage: doc.coverImage,
      publishedAt: (doc.publishedAt ?? new Date()).toISOString(),
      readingMinutes: tiptapReadingMinutes(body),
    };
  }
}
