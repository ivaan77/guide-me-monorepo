import type { ReactNode } from 'react'
import type { EditorPickVariant, TipTapDoc } from '@guide-me-app/core'

// Server-side renderer for TipTap JSON documents. Walks the tree and
// emits JSX for the node types we support in the admin editor. Unknown
// nodes render as null (never throw) so authoring mistakes or future
// extensions don't break existing posts.
//
// Supported nodes:
//   - doc         → wrapping <article>
//   - paragraph   → <p>
//   - heading     → <h2>/<h3> based on attrs.level
//   - bulletList / orderedList → <ul>/<ol>
//   - listItem    → <li>
//   - blockquote  → <blockquote>
//   - image       → <img>
//   - youtube     → responsive 16:9 <iframe>
//   - horizontalRule → <hr>
//   - hardBreak   → <br>
//   - appLink     → hidden on web (mobile-only affordance)
//   - editorPick  → inline tip / highlight callout card
//   - text (leaf) → text with mark wrappers (bold/italic/link)
//
// Text-node marks (bold/italic/link) wrap the string in the order they
// appear on the node. TipTap emits `{type: 'text', text: '...', marks: [...]}`.

type TipTapNode = {
  type?: string
  content?: TipTapNode[]
  attrs?: Record<string, unknown>
  text?: string
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
}

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/

function extractYoutubeId(url: string | undefined): string | null {
  if (!url) return null
  const m = YOUTUBE_ID_RE.exec(url)
  return m?.[1] ?? null
}

function renderMarks(text: string, marks?: TipTapNode['marks']): ReactNode {
  let node: ReactNode = text
  if (!marks) return node
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        node = <strong key="bold">{node}</strong>
        break
      case 'italic':
        node = <em key="italic">{node}</em>
        break
      case 'link': {
        const href = (mark.attrs?.href as string | undefined) ?? '#'
        // Open in a new tab + rel noopener since we can't vet arbitrary
        // author-entered URLs.
        node = (
          <a
            key="link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {node}
          </a>
        )
        break
      }
      // Ignore unknown marks — safer than throwing on a version drift.
    }
  }
  return node
}

function renderChildren(nodes: TipTapNode[] | undefined): ReactNode {
  if (!nodes) return null
  return nodes.map((n, i) => (
    <TipTapNodeRenderer key={i} node={n} />
  ))
}

function TipTapNodeRenderer({ node }: { node: TipTapNode }): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p>{renderChildren(node.content)}</p>
    case 'heading': {
      const level = (node.attrs?.level as number | undefined) ?? 2
      if (level === 2) return <h2>{renderChildren(node.content)}</h2>
      if (level === 3) return <h3>{renderChildren(node.content)}</h3>
      // Fallback for other levels: render as h4 rather than dropping content.
      return <h4>{renderChildren(node.content)}</h4>
    }
    case 'bulletList':
      return <ul>{renderChildren(node.content)}</ul>
    case 'orderedList':
      return <ol>{renderChildren(node.content)}</ol>
    case 'listItem':
      return <li>{renderChildren(node.content)}</li>
    case 'blockquote':
      return <blockquote>{renderChildren(node.content)}</blockquote>
    case 'image': {
      const src = node.attrs?.src as string | undefined
      const alt = (node.attrs?.alt as string | undefined) ?? ''
      if (!src) return null
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} loading="lazy" />
    }
    case 'youtube': {
      const src = node.attrs?.src as string | undefined
      const id = extractYoutubeId(src)
      if (!id) return null
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, margin: '1.5rem 0' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, borderRadius: 12 }}
          />
        </div>
      )
    }
    case 'horizontalRule':
      return <hr />
    case 'hardBreak':
      return <br />
    case 'appLink':
      // appLink cards are a mobile-only affordance — on web they used
      // to link to a homepage anchor that doesn't do anything useful.
      // Skip them entirely on the web renderer; the mobile renderer
      // still shows them and navigates in-app.
      return null
    case 'editorPick': {
      const variant = node.attrs?.variant as EditorPickVariant | undefined
      const title = (node.attrs?.title as string | undefined) ?? ''
      const body = (node.attrs?.body as string | undefined) ?? ''
      if (!variant || (!title && !body)) return null
      return <EditorPickCard variant={variant} title={title} body={body} />
    }
    case 'text':
      return <>{renderMarks(node.text ?? '', node.marks)}</>
    default:
      // Unknown node type — quietly drop it. Better than throwing on an
      // extension we haven't taught the renderer yet.
      return null
  }
}

export function TipTapRenderer({ doc }: { doc: TipTapDoc | undefined }) {
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return null
  return <>{renderChildren(doc.content as TipTapNode[])}</>
}

// Editorial pick card — inline callout with two visual variants.
// `not-prose` opts out of the article's default typography reset (which
// would otherwise italicize / bold / space our own text unpredictably).
// Colors match the WeatherBanner tones: amber/caution for tips, blue/
// neutral for highlights, so the whole system reads consistent.
function EditorPickCard({
  variant,
  title,
  body,
}: {
  variant: EditorPickVariant
  title: string
  body: string
}) {
  const isTip = variant === 'tip'
  // Two distinct visual identities:
  //   tip       → yellow card, dark-amber label, lightbulb icon in a
  //               solid amber circle on the left
  //   highlight → blue card, dark-blue label, info icon in a solid blue
  //               circle on the left
  // Alpha bumped up from the previous washed-out 8-10% so the card is
  // unambiguously "a yellow box" / "a blue box" at a glance.
  const style = isTip
    ? {
        bg: '#FFF4DA', // solid soft-yellow
        border: '#F9C86A', // stronger amber border
        badgeBg: '#F59E0B', // amber-500 badge
        accent: '#92400E', // amber-900 label text
        label: 'Tip',
        icon: '💡',
      }
    : {
        bg: '#E6EFFE', // solid soft-blue
        border: '#93B4F5', // stronger blue border
        badgeBg: '#3B82F6', // blue-500 badge
        accent: '#1E3A8A', // blue-900 label text
        label: 'Highlight',
        icon: 'ℹ️',
      }
  return (
    <aside
      className="not-prose my-6 flex items-center gap-4 rounded-2xl border-2 p-5"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      {/* Left column: circular icon badge. Fixed width so long body copy
          wraps under the text column rather than under the icon. */}
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: style.badgeBg }}
        aria-hidden="true"
      >
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className="block text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: style.accent }}
        >
          {style.label}
        </span>
        {title && (
          <p
            className="mt-0.5 text-base font-semibold"
            style={{ color: style.accent, marginBottom: 0 }}
          >
            {title}
          </p>
        )}
        {body && (
          // Body text uses the same accent color as the title so the
          // card reads as a single tonal block (matches the mobile
          // rendering). Explicit marginBottom overrides the outer
          // BlogArticle wrapper's [&_p]:mb-3 which would otherwise add
          // extra space inside the card.
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: style.accent, marginBottom: 0 }}
          >
            {body}
          </p>
        )}
      </div>
    </aside>
  )
}
