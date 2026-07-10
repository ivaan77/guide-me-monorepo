// Compact number formatting for marketing counters — matches the "1.2k"
// convention once we cross the thousand mark. Under 1000 we show the raw
// number so early days don't look padded ("48 places" reads honest; "0.0k"
// is silly).
export function fmtCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

// English pluralization only — the marketing web is not localized. Once
// the raw count crosses 1000 (or we render "1.2k" etc) we always use the
// plural form; "1.0 Excursions" reads more naturally than "1.0 Excursion".
export function pluralize(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}
