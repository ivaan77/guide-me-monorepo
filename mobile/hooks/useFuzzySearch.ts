import { useMemo } from 'react'
import Fuse, { type IFuseOptions } from 'fuse.js'
import { normalizeForSearch } from '../lib/normalize'

// Generic diacritic-insensitive fuzzy search hook backed by Fuse.js, with
// a subsequence-match fallback for consonant-style queries.
//
// Two-pass strategy:
//   1. Fuse pass — handles typos ("zabreb" → Zagreb) and diacritic-free
//      input ("sibenik" → Šibenik). This is the primary matcher; results
//      come back in Fuse's relevance order.
//   2. Subsequence fallback — only runs when the Fuse pass returns nothing.
//      Treats the query as an ordered sequence of characters that must
//      appear (with gaps allowed) in one of the fields. Handles Croatian
//      shorthand: "zg" → Zagreb, "st" → Split, "dbk" → Dubrovnik.
//
// Design notes:
// - Fuse doesn't strip diacritics on its own. We shadow each item with an
//   internal record whose search fields are pre-normalized, then hand that
//   to Fuse. The query is normalized the same way before searching.
// - The Fuse index is rebuilt only when `items` or `keys` change — not on
//   every keystroke. Callers should debounce the query before passing it
//   in, or the render itself becomes a bottleneck at ~1000 items.
// - An empty / whitespace-only query returns the items unchanged; Fuse
//   would otherwise return an empty result set.
//
// `keys` are property names on T whose STRING values will be searched.
// Non-string fields are ignored. Nested paths (e.g. 'city.country') are
// not supported — keep it flat for now.

type FuzzyOptions = {
  // 0 = perfect match required, 1 = matches anything. 0.4 hits the sweet
  // spot for tourism (typos like 'zabreb' → 'Zagreb') without dredging up
  // unrelated cities on 2-letter queries.
  threshold?: number
  // Minimum characters before we bother matching. Below this, Fuse tends
  // to return everything.
  minMatchCharLength?: number
}

export function useFuzzySearch<T>(
  items: T[] | undefined,
  keys: (keyof T & string)[],
  query: string,
  options?: FuzzyOptions,
): T[] {
  const threshold = options?.threshold ?? 0.4
  const minMatchCharLength = options?.minMatchCharLength ?? 2

  // Pre-normalize the searchable fields once per items/keys change.
  // Shadow record keeps the original item plus a mirror of the searchable
  // fields with diacritics stripped, so Fuse operates on ASCII-only text.
  const { fuse, shadow, source } = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        fuse: null as Fuse<Shadow<T>> | null,
        shadow: [] as Shadow<T>[],
        source: [] as T[],
      }
    }
    const built: Shadow<T>[] = items.map((item) => {
      const norm: Record<string, string> = {}
      for (const k of keys) {
        const v = (item as Record<string, unknown>)[k]
        if (typeof v === 'string') norm[k] = normalizeForSearch(v)
      }
      return { item, norm }
    })
    const fuseOptions: IFuseOptions<Shadow<T>> = {
      // Match against the normalized shadow, not the original object.
      keys: keys.map((k) => `norm.${k}`),
      threshold,
      minMatchCharLength,
      ignoreLocation: true, // otherwise Fuse weights matches at the start of the string very heavily
      includeScore: false,
    }
    return {
      fuse: new Fuse(built, fuseOptions),
      shadow: built,
      source: items,
    }
  }, [items, keys, threshold, minMatchCharLength])

  return useMemo(() => {
    const q = normalizeForSearch(query.trim())
    // Below the minimum-match threshold (empty or single character), show
    // the full list rather than an empty result — the user hasn't really
    // "searched for" anything yet. Prevents the jarring "type one letter
    // → everything disappears" flash.
    if (q.length < minMatchCharLength) return source
    if (!fuse) return []

    const fuseHits = fuse.search(q).map((r) => r.item.item)
    if (fuseHits.length > 0) return fuseHits

    // Subsequence fallback for consonant-style queries ("zg", "dbk").
    // Only fires when Fuse found nothing so we don't dilute higher-quality
    // Fuse matches with looser subsequence noise.
    return shadow
      .filter((s) => keys.some((k) => isSubsequence(q, s.norm[k] ?? '')))
      .map((s) => s.item)
  }, [fuse, shadow, source, query, keys, minMatchCharLength])
}

// Returns true if every character of `needle` appears in `haystack`
// in order, gaps allowed. "zg" ⊂ "zagreb", "dbk" ⊂ "dubrovnik".
// Both inputs are assumed already lowercased + normalized.
function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true
  if (needle.length > haystack.length) return false
  let i = 0
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++
  }
  return i === needle.length
}

type Shadow<T> = {
  item: T
  norm: Record<string, string>
}
