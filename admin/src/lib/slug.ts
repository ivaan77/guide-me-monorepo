// URL-safe slug derivation matching the api's SLUG_REGEX:
// /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
//   - lowercase letters, numbers, hyphens
//   - no leading or trailing hyphen
//   - at least one character

// Normalize accents/diacritics (Café → Cafe, Žagar → Zagar, etc), strip
// anything that isn't ASCII alnum or space/hyphen, collapse runs of
// separators into single hyphens, trim leading/trailing hyphens.
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // drop everything not alnum/space/hyphen
    .trim()
    .replace(/[\s_-]+/g, '-') // collapse runs of separators into one hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

// Append numeric suffix until the slug is unique. Empty `base` returns ''.
// Used both for top-level entities (cities/places/excursions) and for
// nested ones (stops/facts within the same form) — `existing` is whatever
// list of taken slugs the caller knows about.
export function buildUniqueSlug(
  base: string,
  existing: Iterable<string>,
): string {
  if (!base) return ''
  const taken = new Set(existing)
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}
