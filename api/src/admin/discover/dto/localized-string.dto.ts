import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

// Matches the LocalizedString type in @guide-me-app/core.
// en is required, de/hr optional. Class-validator runs at runtime.

// Content is almost always pasted in from a document, which drags along
// trailing spaces and tabs. Those survive into the mobile UI as a ragged
// name ("Zadar ") and sort oddly when they land at the front (" Bl3nd").
// Trim on the way in so the database never stores them; non-strings are
// passed through untouched so @IsString still reports the real error.
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class LocalizedStringDto {
  @Transform(trim)
  @IsString()
  en: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  de?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  hr?: string;
}
