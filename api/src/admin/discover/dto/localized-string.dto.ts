import { IsOptional, IsString } from 'class-validator';

// Matches the LocalizedString type in @guide-me-app/core.
// en is required, de/hr optional. Class-validator runs at runtime.
export class LocalizedStringDto {
  @IsString()
  en: string;

  @IsOptional()
  @IsString()
  de?: string;

  @IsOptional()
  @IsString()
  hr?: string;
}
