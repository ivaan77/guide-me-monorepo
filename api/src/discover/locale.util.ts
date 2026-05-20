import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES } from '@guide-me-app/core';

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES);

// Parse Accept-Language and return the best supported match.
// Handles entries like "en-US,en;q=0.9,de;q=0.7" by extracting the primary
// subtag (en, de, hr) and picking the highest-q match.
export function parseAcceptLanguage(header: string | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const entries = header
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const [tag, ...params] = part.split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2);
      const quality = q !== undefined ? Number(q) : 1;
      const primary = tag.split('-')[0]?.toLowerCase() ?? '';
      return { primary, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((e) => e.primary && SUPPORTED.has(e.primary))
    .sort((a, b) => b.quality - a.quality);

  return (entries[0]?.primary as Locale) ?? DEFAULT_LOCALE;
}
