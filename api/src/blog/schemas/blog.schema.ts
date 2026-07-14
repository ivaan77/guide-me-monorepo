import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import {
  LocalizedStringSub,
  LocalizedStringSubSchema,
} from '../../discover/schemas/locale.subdocuments';

export const BLOG_CATEGORIES = [
  'travel-tips',
  'city-guide',
  'food-drink',
  'news',
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_STATUSES = ['draft', 'published'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

// TipTap docs are arbitrary nested JSON trees. Storing as Mixed lets the
// author add extensions (images, YouTube, appLink, custom nodes) without
// requiring a schema migration each time. Renderers on web/mobile treat
// the tree defensively — unknown node types render as empty.
//
// Per-locale slots: en is required at the app layer (DTO validation),
// others optional. We can't enforce required on Mixed at the mongoose
// layer, so the DTO owns that guarantee.
@Schema({ _id: false })
export class LocalizedRichTextSub {
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  en: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  de?: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  hr?: unknown;
}

export const LocalizedRichTextSubSchema =
  SchemaFactory.createForClass(LocalizedRichTextSub);

@Schema({ collection: 'blogs', timestamps: true })
export class Blog {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({
    required: true,
    enum: BLOG_STATUSES,
    default: 'draft',
    index: true,
  })
  status: BlogStatus;

  @Prop({
    required: true,
    enum: BLOG_CATEGORIES,
    index: true,
  })
  category: BlogCategory;

  @Prop({ required: true })
  coverImage: string;

  // Optional city tie. When set, the post appears in that city's
  // CityDetailScreen "Related stories" section AND in the Stories tab
  // filtered by that city. When absent, the post is "general" and only
  // shows up in the unfiltered Stories list. The value is a DiscoverCity
  // slug — no FK enforcement (soft link) so deleting the city doesn't
  // cascade and break articles; the filter just silently returns no
  // matches until the city returns or the author reassigns the post.
  @Prop({ index: true })
  citySlug?: string;

  @Prop()
  ogImage?: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  title: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  excerpt: LocalizedStringSub;

  @Prop({ type: LocalizedRichTextSubSchema, required: true })
  body: LocalizedRichTextSub;

  @Prop({ type: LocalizedStringSubSchema })
  metaTitle?: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema })
  metaDescription?: LocalizedStringSub;

  // Set on FIRST publish only. Stays fixed so re-editing a published post
  // doesn't ruin its "recently published" position for search + card feeds.
  // Compare `updatedAt` if you want to know when it was last touched.
  @Prop({ type: Date, index: true })
  publishedAt?: Date;

  // Random 32-hex-char token that gates the /public/blogs/preview/:slug
  // endpoint. Generated once on create; regenerate to invalidate any
  // previously-shared preview URLs. Never leaked on PublicBlog projections
  // — if it ends up on the mobile app payload, every draft is world-
  // readable. AdminBlog projection includes it so admin can build the
  // preview URL. The Mongoose default gives legacy docs a token on first
  // save so nothing breaks if the field is missing on read.
  @Prop({
    required: true,
    default: (): string =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('crypto').randomBytes(16).toString('hex'),
  })
  previewToken: string;
}

export type BlogDocument = HydratedDocument<Blog>;
export const BlogSchema = SchemaFactory.createForClass(Blog);

// Compound index for the public list endpoint: filter by status+category,
// order by publishedAt DESC.
BlogSchema.index({ status: 1, category: 1, publishedAt: -1 });

// Compound index for the "stories for city X" query used by the mobile
// Stories tab city filter and the CityDetailScreen related-stories row.
BlogSchema.index({ status: 1, citySlug: 1, publishedAt: -1 });
