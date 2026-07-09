// Diacritic-insensitive string normalization for search.
//
// Users on Croatian keyboards / phone auto-correct often type city names
// without diacritics ("sibenik" for "Šibenik", "djakovo" for "Đakovo").
// Match both sides via NFD normalization + a small map for characters
// NFD doesn't split (đ / Đ — Latin extended, not diacritic composition).
//
// The output is lowercased so search callers don't have to. Do NOT use
// this for display — only as input to search indexes / comparisons.

const NON_NFD_MAP: Record<string, string> = {
  đ: 'd',
  Đ: 'd',
  ð: 'd',
  ø: 'o',
  Ø: 'o',
  ł: 'l',
  Ł: 'l',
  ß: 'ss',
}

const NON_NFD_RE = new RegExp(
  `[${Object.keys(NON_NFD_MAP).join('')}]`,
  'g',
)

export function normalizeForSearch(input: string): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .normalize('NFD')
    // Strip combining marks (accents, tildes, umlauts, etc.) that NFD split
    // out into their own code points.
    .replace(/[̀-ͯ]/g, '')
    // Handle characters that don't decompose (Croatian đ, Polish ł, etc.).
    .replace(NON_NFD_RE, (ch) => NON_NFD_MAP[ch] ?? ch)
}
