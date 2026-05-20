import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { LocalizedStringDto } from './localized-string.dto';

// Slugs: lowercase letters, numbers, hyphens. No leading/trailing hyphen.
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

class EditorPickDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  headline: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  tagline: LocalizedStringDto;
}

export class CreateCityDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsString()
  image: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  country: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EditorPickDto)
  editorPick?: EditorPickDto;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  country?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EditorPickDto)
  editorPick?: EditorPickDto;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
