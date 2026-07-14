import { mergeAttributes, Node } from '@tiptap/core'
import type { AppLinkAttrs, AppLinkKind } from '@guide-me-app/core'

// Custom block-level node representing an in-article deep link to a
// city/place/excursion. Non-editable content: renderers on web + mobile
// display it as a rich card. In the admin editor it shows up as a
// simple placeholder pill — inline HTML rendered in DOM, but the source
// of truth is the attrs. The picker (see AppLinkPicker) inserts these.

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    appLink: {
      insertAppLink: (attrs: AppLinkAttrs) => ReturnType
    }
  }
}

const KIND_LABEL: Record<AppLinkKind, string> = {
  city: 'City',
  place: 'Place',
  excursion: 'Excursion',
}

export const AppLinkNode = Node.create({
  name: 'appLink',
  // Block-level so it sits between paragraphs, not inline in text.
  group: 'block',
  // No editable text inside; the node is fully attr-driven.
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      kind: {
        default: 'city',
        parseHTML: (el) => el.getAttribute('data-kind') ?? 'city',
        renderHTML: (attrs) => ({ 'data-kind': attrs.kind as string }),
      },
      id: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-id') ?? '',
        renderHTML: (attrs) => ({ 'data-id': attrs.id as string }),
      },
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-label') ?? '',
        renderHTML: (attrs) => ({ 'data-label': attrs.label as string }),
      },
      imageUrl: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-image-url'),
        renderHTML: (attrs) =>
          attrs.imageUrl
            ? { 'data-image-url': attrs.imageUrl as string }
            : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-app-link]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    // In-editor preview. Web + mobile ignore this HTML and re-render the
    // node from JSON with their own components (see TipTapRenderer).
    const kind = node.attrs.kind as AppLinkKind
    const label = (node.attrs.label as string) || 'Untitled'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-app-link': 'true',
        style:
          'display:flex;gap:12px;align-items:center;padding:12px 16px;margin:12px 0;border:1px solid var(--color-border);border-radius:12px;background:var(--color-muted);',
      }),
      [
        'span',
        {
          style:
            'font-size:10px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;color:var(--color-primary);',
        },
        KIND_LABEL[kind] ?? 'Link',
      ],
      ['strong', { style: 'font-size:14px;' }, label],
    ]
  },

  addCommands() {
    return {
      insertAppLink:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'appLink',
            attrs,
          }),
    }
  },
})
