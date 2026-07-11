import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

class GalleryUpdateEntryDto {
  @IsString()
  @Matches(SLUG_REGEX)
  slug: string;

  @IsIn(['city', 'place'])
  sourceType: 'city' | 'place';

  @IsBoolean()
  webFeatured: boolean;

  @IsInt()
  @Min(0)
  webFeaturedOrder: number;
}

export class GalleryUpdateDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => GalleryUpdateEntryDto)
  items: GalleryUpdateEntryDto[];
}
