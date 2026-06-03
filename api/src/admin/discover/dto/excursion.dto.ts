import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { LatLngDto } from './lat-lng.dto';
import { LocalizedAudioDto } from './localized-audio.dto';
import { LocalizedStringDto } from './localized-string.dto';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

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
  @ValidateNested()
  @Type(() => LocalizedAudioDto)
  audioUrl?: LocalizedAudioDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  triggerRadius?: number;
}

class ExcursionPoiRefDto {
  @IsString()
  @Matches(SLUG_REGEX)
  placeSlug: string;

  @IsInt()
  @Min(0)
  order: number;
}

class InterestingFactDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedAudioDto)
  audioUrl: LocalizedAudioDto;
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
  @Type(() => ExcursionPoiRefDto)
  pois?: ExcursionPoiRefDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestingFactDto)
  interestingFacts?: InterestingFactDto[];

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
  @Type(() => ExcursionPoiRefDto)
  pois?: ExcursionPoiRefDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestingFactDto)
  interestingFacts?: InterestingFactDto[];

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
