import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  BLOG_CATEGORIES,
  BLOG_STATUSES,
} from '../../../blog/schemas/blog.schema';
import { LocalizedStringDto } from '../../discover/dto/localized-string.dto';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// LocalizedRichTextDto — same locale shape as LocalizedStringDto but the
// values are TipTap JSON documents. We validate `en` is an object (has
// to be at least a `{type: 'doc'}` node) and leave the tree contents to
// TipTap's own schema. Rendering handles malformed nodes gracefully.
export class LocalizedRichTextDto {
  @IsObject()
  en: unknown;

  @IsOptional()
  @IsObject()
  de?: unknown;

  @IsOptional()
  @IsObject()
  hr?: unknown;
}

export class CreateBlogDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsOptional()
  @IsIn(BLOG_STATUSES)
  status?: (typeof BLOG_STATUSES)[number];

  @IsIn(BLOG_CATEGORIES)
  category: (typeof BLOG_CATEGORIES)[number];

  // Optional city tie. Slug-shaped when present; empty/absent means
  // "general" (no city). We accept empty string too and normalize it
  // to undefined in the service so admin can send an empty select
  // without special-casing on the client.
  @IsOptional()
  @IsString()
  @Matches(SLUG_REGEX)
  citySlug?: string;

  @IsString()
  coverImage: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  excerpt: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedRichTextDto)
  body: LocalizedRichTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaTitle?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaDescription?: LocalizedStringDto;
}

export class UpdateBlogDto {
  @IsOptional()
  @IsIn(BLOG_STATUSES)
  status?: (typeof BLOG_STATUSES)[number];

  @IsOptional()
  @IsIn(BLOG_CATEGORIES)
  category?: (typeof BLOG_CATEGORIES)[number];

  // Update-side accepts empty string to CLEAR the tie (server converts
  // empty → undefined). Non-empty must match slug shape.
  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  excerpt?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedRichTextDto)
  body?: LocalizedRichTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaTitle?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaDescription?: LocalizedStringDto;
}
