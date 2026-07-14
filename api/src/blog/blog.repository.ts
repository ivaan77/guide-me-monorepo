import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type FilterQuery, type UpdateQuery } from 'mongoose';
import type { BlogCategory } from '@guide-me-app/core';
import { Blog, BlogDocument } from './schemas/blog.schema';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: Model<Blog>,
  ) {}

  // --- Public reads (status: 'published' only) ---

  async findPublished(opts: {
    category?: BlogCategory;
    citySlug?: string;
    limit: number;
    skip: number;
  }): Promise<{ posts: BlogDocument[]; total: number }> {
    const filter: FilterQuery<Blog> = { status: 'published' };
    if (opts.category) filter.category = opts.category;
    if (opts.citySlug) filter.citySlug = opts.citySlug;
    const [posts, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort({ publishedAt: -1, _id: -1 })
        .skip(opts.skip)
        .limit(opts.limit)
        .lean<BlogDocument[]>()
        .exec(),
      this.blogModel.countDocuments(filter).exec(),
    ]);
    return { posts, total };
  }

  findPublishedBySlug(slug: string): Promise<BlogDocument | null> {
    return this.blogModel
      .findOne({ slug, status: 'published' })
      .lean<BlogDocument>()
      .exec();
  }

  // Preview read: returns the post regardless of status when the caller
  // supplies a token that matches the doc's previewToken. Used by the web
  // preview URL so authors + reviewers can see unpublished drafts. Missing
  // or mismatched token yields null — controller turns that into a 404 so
  // token-guessers can't distinguish "post exists but wrong token" from
  // "no such post."
  findByPreviewToken(
    slug: string,
    token: string,
  ): Promise<BlogDocument | null> {
    if (!token) return Promise.resolve(null);
    return this.blogModel
      .findOne({ slug, previewToken: token })
      .lean<BlogDocument>()
      .exec();
  }

  // --- Admin reads (all statuses) ---

  findAll(): Promise<BlogDocument[]> {
    return this.blogModel
      .find()
      .sort({ updatedAt: -1 })
      .lean<BlogDocument[]>()
      .exec();
  }

  findBySlug(slug: string): Promise<BlogDocument | null> {
    return this.blogModel.findOne({ slug }).lean<BlogDocument>().exec();
  }

  create(doc: Partial<Blog>): Promise<BlogDocument> {
    return this.blogModel.create(doc) as unknown as Promise<BlogDocument>;
  }

  updateBySlug(
    slug: string,
    update: UpdateQuery<Blog>,
  ): Promise<BlogDocument | null> {
    return this.blogModel
      .findOneAndUpdate({ slug }, update, { new: true })
      .lean<BlogDocument>()
      .exec();
  }

  deleteBySlug(slug: string): Promise<{ deletedCount?: number }> {
    return this.blogModel.deleteOne({ slug }).exec();
  }
}
