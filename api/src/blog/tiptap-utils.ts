import type { TipTapDoc } from '@guide-me-app/core';

// Average adult reading speed. 220 words/min lands on the polite side; users
// see a slightly-generous "5 min read" and rarely feel misled by it.
const WORDS_PER_MINUTE = 220;

// Extract plain text from a TipTap JSON tree. Ignores unknown node types.
// Used for reading-time estimation and (in the future) plain-text excerpts
// for platforms without a rich-text renderer.
export function tiptapPlainText(doc: TipTapDoc | undefined): string {
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return '';
  const chunks: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === 'string') chunks.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  doc.content.forEach(walk);
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

// Returns undefined when doc is empty so the client can render "· 4 min read"
// only for actual articles.
export function tiptapReadingMinutes(
  doc: TipTapDoc | undefined,
): number | undefined {
  const text = tiptapPlainText(doc);
  if (!text) return undefined;
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return minutes;
}
