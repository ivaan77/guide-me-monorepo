'use client'

import { type Content, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { TipTapDoc } from '@guide-me-app/core'

// Rich-text editor for blog post bodies. Emits TipTap JSON via onChange so
// the parent (RHF Controller) stores it directly on the form. Supports:
//   - paragraphs, headings (h2/h3), bold, italic
//   - bullet + ordered lists, blockquote
//   - images (URL prompt — same pattern as ImageInput; no upload pipeline)
//   - YouTube embeds (paste any youtube.com/youtu.be URL)
//   - links (URL prompt)
//
// Rendered as a bordered box with a toolbar row + editor surface. The
// output document is always shaped `{ type: 'doc', content: [...] }`.

const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [] }

type Props = {
  label: string
  value?: TipTapDoc
  onChange: (doc: TipTapDoc) => void
  required?: boolean
  hint?: string
}

export function RichTextEditor({ label, value, onChange, required, hint }: Props) {
  const editor = useEditor({
    extensions: [
      // StarterKit gives us paragraph, heading (all levels), bold, italic,
      // strike, code, bulletList, orderedList, listItem, blockquote,
      // codeBlock, hardBreak, history. We only expose h2/h3 in the toolbar
      // — h1 is reserved for the post title itself.
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      // Standard Image node — TipTap doesn't ship a resize UI, but we
      // just need the src stored; the web renderer will size it responsively.
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Youtube.configure({
        // Keep our stored doc small — Youtube extension can autofetch the
        // thumbnail, we skip that and let the renderer do it.
        controls: true,
        nocookie: true,
      }),
    ],
    // TipTap's Content type is intentionally loose; our TipTapDoc.content
    // is `unknown[]` because the shape is opaque at the boundary. The cast
    // to Content lets the editor consume it — TipTap treats invalid nodes
    // as no-ops rather than throwing.
    content: (value ?? EMPTY_DOC) as unknown as Content,
    // ImmediatelyRender=false avoids SSR hydration warnings (this is a
    // client-only component inside a client form, but Next 15 still emits
    // a warning otherwise).
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TipTapDoc)
    },
  })

  // If the parent switches locales (per-locale tabs above the editor),
  // the value prop changes — we need to reset the editor content so the
  // new locale's body shows up instead of the previous one.
  useEffect(() => {
    if (!editor) return
    const current = editor.getJSON() as TipTapDoc
    // Cheap identity check: if the doc reference is the same, skip. This
    // prevents an update-on-own-onChange loop.
    if (value && value === current) return
    const incoming = value ?? EMPTY_DOC
    // setContent(false) = don't emit an update event; we already have the
    // value in the parent.
    editor.commands.setContent(incoming as unknown as Content, { emitUpdate: false })
  }, [editor, value])

  if (!editor) return null

  const promptForUrl = (message: string): string | null => {
    const url = window.prompt(message)
    if (!url) return null
    return url.trim()
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="text-[var(--color-destructive)] ml-1">*</span>}
      </Label>
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] p-2">
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            &ldquo; Quote
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = promptForUrl('Image URL (Unsplash, CDN, etc.)')
              if (url) editor.chain().focus().setImage({ src: url }).run()
            }}
          >
            + Image
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = promptForUrl('YouTube URL')
              if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
            }}
          >
            + Video
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={() => {
              const previous = editor.getAttributes('link').href as string | undefined
              const url = promptForUrl(previous ? 'Link URL (leave blank to remove)' : 'Link URL')
              if (url === null) return
              if (url === '') {
                editor.chain().focus().unsetLink().run()
                return
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }}
          >
            🔗 Link
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[var(--color-border)] [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-4 [&_.ProseMirror_a]:text-[var(--color-primary)] [&_.ProseMirror_a]:underline"
        />
      </div>
      {hint && <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>}
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="h-8 px-2 text-xs"
    >
      {children}
    </Button>
  )
}
