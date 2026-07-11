import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminBlog,
  AdminBlogListResponse,
  AdminBlogResponse,
} from '@guide-me-app/core';
import { BlogRepository } from '../../blog/blog.repository';
import type { BlogDocument } from '../../blog/schemas/blog.schema';
import { CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@Injectable()
export class AdminBlogService {
  constructor(private readonly repo: BlogRepository) {}

  async list(): Promise<AdminBlogListResponse> {
    const docs = await this.repo.findAll();
    return { posts: docs.map((d) => this.toAdmin(d)) };
  }

  async getBySlug(slug: string): Promise<AdminBlogResponse> {
    const doc = await this.repo.findBySlug(slug);
    if (!doc) throw new NotFoundException(`Blog post not found: ${slug}`);
    return { post: this.toAdmin(doc) };
  }

  async create(dto: CreateBlogDto): Promise<AdminBlogResponse> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Slug already in use: ${dto.slug}`);
    }
    const status = dto.status ?? 'draft';
    // First-time-published: stamp publishedAt now. Otherwise leave undefined.
    const publishedAt = status === 'published' ? new Date() : undefined;
    const doc = await this.repo.create({
      slug: dto.slug,
      status,
      category: dto.category,
      coverImage: dto.coverImage,
      ogImage: dto.ogImage,
      title: dto.title,
      excerpt: dto.excerpt,
      body: dto.body as unknown as BlogDocument['body'],
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      publishedAt,
    });
    return { post: this.toAdmin(doc) };
  }

  async update(slug: string, dto: UpdateBlogDto): Promise<AdminBlogResponse> {
    const existing = await this.repo.findBySlug(slug);
    if (!existing) throw new NotFoundException(`Blog post not found: ${slug}`);

    const update: Partial<BlogDocument> = {};
    if (dto.category !== undefined) update.category = dto.category;
    if (dto.coverImage !== undefined) update.coverImage = dto.coverImage;
    if (dto.ogImage !== undefined) update.ogImage = dto.ogImage;
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.excerpt !== undefined) update.excerpt = dto.excerpt;
    if (dto.body !== undefined)
      update.body = dto.body as unknown as BlogDocument['body'];
    if (dto.metaTitle !== undefined) update.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) {
      update.metaDescription = dto.metaDescription;
    }

    if (dto.status !== undefined) {
      update.status = dto.status;
      // First-publish transition: stamp publishedAt now. Once set it never
      // moves — republishing after a draft cycle should keep the original
      // publish date so RSS/search don't see it as new.
      if (dto.status === 'published' && !existing.publishedAt) {
        update.publishedAt = new Date();
      }
    }

    const updated = await this.repo.updateBySlug(slug, update);
    if (!updated) throw new NotFoundException(`Blog post not found: ${slug}`);
    return { post: this.toAdmin(updated) };
  }

  async delete(slug: string): Promise<void> {
    const res = await this.repo.deleteBySlug(slug);
    if (!res.deletedCount) {
      throw new NotFoundException(`Blog post not found: ${slug}`);
    }
  }

  private toAdmin(doc: BlogDocument): AdminBlog {
    return {
      slug: doc.slug,
      status: doc.status,
      category: doc.category,
      coverImage: doc.coverImage,
      ogImage: doc.ogImage,
      title: doc.title,
      excerpt: doc.excerpt,
      body: doc.body as unknown as AdminBlog['body'],
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription,
      publishedAt: doc.publishedAt?.toISOString(),
      // Mongoose `timestamps: true` adds these as Dates.
      createdAt: (
        doc as unknown as { createdAt: Date }
      ).createdAt.toISOString(),
      updatedAt: (
        doc as unknown as { updatedAt: Date }
      ).updatedAt.toISOString(),
    };
  }
}
