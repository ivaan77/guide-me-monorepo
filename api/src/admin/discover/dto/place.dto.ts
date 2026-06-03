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
import { PLACE_CATEGORIES } from '../../../discover/schemas/discover-place.schema';
import { LatLngDto } from './lat-lng.dto';
import { LocalizedAudioDto } from './localized-audio.dto';
import { LocalizedStringDto } from './localized-string.dto';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export class CreatePlaceDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsString()
  @Matches(SLUG_REGEX)
  citySlug: string;

  @IsIn(PLACE_CATEGORIES)
  category: (typeof PLACE_CATEGORIES)[number];

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
  @ValidateNested()
  @Type(() => LatLngDto)
  coords?: LatLngDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subCategory?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedAudioDto)
  audioUrl?: LocalizedAudioDto;

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
  @IsIn(PLACE_CATEGORIES)
  category?: (typeof PLACE_CATEGORIES)[number];

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
  @ValidateNested()
  @Type(() => LatLngDto)
  coords?: LatLngDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subCategory?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedAudioDto)
  audioUrl?: LocalizedAudioDto;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
