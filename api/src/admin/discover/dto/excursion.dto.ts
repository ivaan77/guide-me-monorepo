import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { LatLngDto } from './lat-lng.dto';
import { LocalizedStringDto } from './localized-string.dto';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const CATEGORIES = ['restaurant', 'bar', 'shopping'] as const;

class ExcursionStopDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsInt()
  @Min(0)
  order: number;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LatLngDto)
  coords: LatLngDto;

  @IsString()
  image: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  audioUrl?: string;
}

class PoiDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsInt()
  @Min(0)
  order: number;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @IsIn(CATEGORIES)
  category: (typeof CATEGORIES)[number];

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LatLngDto)
  coords: LatLngDto;

  @IsString()
  image: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateExcursionDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsString()
  @Matches(SLUG_REGEX)
  citySlug: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  meta: LocalizedStringDto;

  @IsString()
  image: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcursionStopDto)
  stops?: ExcursionStopDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoiDto)
  pois?: PoiDto[];

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateExcursionDto {
  @IsOptional()
  @IsString()
  @Matches(SLUG_REGEX)
  citySlug?: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcursionStopDto)
  stops?: ExcursionStopDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoiDto)
  pois?: PoiDto[];

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
