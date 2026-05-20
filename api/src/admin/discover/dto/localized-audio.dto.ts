import { IsOptional, IsString } from 'class-validator';

// Mirrors LocalizedAudio from @guide-me-app/core. All optional — a stop may
// have audio in only some locales, or none.
export class LocalizedAudioDto {
  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  de?: string;

  @IsOptional()
  @IsString()
  hr?: string;
}
