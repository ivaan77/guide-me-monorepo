import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from './localized-string.dto';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const CATEGORIES = ['restaurant', 'bar', 'shopping'] as const;

export class CreatePlaceDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsString()
  @Matches(SLUG_REGEX)
  citySlug: string;

  @IsIn(CATEGORIES)
  category: (typeof CATEGORIES)[number];

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta: LocalizedStringDto;

  @IsString()
  image: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdatePlaceDto {
  @IsOptional()
  @IsString()
  @Matches(SLUG_REGEX)
  citySlug?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta?: LocalizedStringDto;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
