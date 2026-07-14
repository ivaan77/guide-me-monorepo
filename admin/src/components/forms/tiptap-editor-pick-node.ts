import { mergeAttributes, Node } from '@tiptap/core'
import type { EditorPickAttrs, EditorPickVariant } from '@guide-me-app/core'

// Custom block node for inline "editor pick" cards inside blog bodies.
// Two variants:
//   - tip:       practical suggestion. Amber palette on web/mobile.
//   - highlight: important context.    Blue palette on web/mobile.
//
// Author-authored plain-string title + body. Insert via the Tip /
// Highlight toolbar buttons in RichTextEditor (which pop a small dialog
// asking for title + body).

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    editorPick: {
      insertEditorPick: (attrs: EditorPickAttrs) => ReturnType
    }
  }
}

const VARIANT_LABEL: Record<EditorPickVariant, string> = {
  tip: 'Tip',
  highlight: 'Highlight',
}

export const EditorPickNode = Node.create({
  name: 'editorPick',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      variant: {
        default: 'tip',
        parseHTML: (el) => el.getAttribute('data-variant') ?? 'tip',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant as string }),
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') ?? '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title as string }),
      },
      body: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-body') ?? '',
        renderHTML: (attrs) => ({ 'data-body': attrs.body as string }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-editor-pick]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    // In-editor preview. Web + mobile ignore this HTML and re-render
    // from JSON with their own components; we keep the colors + layout
    // in sync so the in-editor view fairly represents the shipped card
    // (solid yellow / solid blue, icon badge on the left).
    const variant = node.attrs.variant as EditorPickVariant
    const title = (node.attrs.title as string) || 'Untitled'
    const body = (node.attrs.body as string) || ''
    const isTip = variant === 'tip'
    const bg = isTip ? '#FFF4DA' : '#E6EFFE'
    const border = isTip ? '#F9C86A' : '#93B4F5'
    const badgeBg = isTip ? '#F59E0B' : '#3B82F6'
    const accent = isTip ? '#92400E' : '#1E3A8A'
    const emoji = isTip ? '💡' : 'ℹ️'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-editor-pick': 'true',
        style: `display:flex;align-items:center;gap:16px;padding:16px;margin:14px 0;border:2px solid ${border};border-radius:16px;background:${bg};`,
      }),
      [
        'div',
        {
          style: `width:44px;height:44px;border-radius:22px;background:${badgeBg};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;`,
        },
        emoji,
      ],
      [
        'div',
        { style: 'display:flex;flex-direction:column;gap:4px;' },
        [
          'span',
          {
            style: `font-size:10px;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;color:${accent};`,
          },
          VARIANT_LABEL[variant] ?? 'Card',
        ],
        ['strong', { style: `font-size:15px;color:${accent};` }, title],
        [
          'span',
          { style: `font-size:13px;line-height:1.4;color:${accent};` },
          body,
        ],
      ],
    ]
  },

  addCommands() {
    return {
      insertEditorPick:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'editorPick',
            attrs,
          }),
    }
  },
})
