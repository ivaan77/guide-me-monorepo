import { Info } from 'lucide-react'

// Small info-icon that sits inline next to a form Label. Hovering on
// desktop reveals a tooltip with the explanation of where the field
// surfaces on mobile. CSS-only — no radix portal or popover lib needed.
//
// Implementation: the wrapper has `group` so the absolutely-positioned
// child tooltip becomes visible on hover/focus. Using opacity + transform
// keeps it accessible (still in the DOM, screen readers can find it)
// without z-index battles.
//
// Usage:
//   <div className="flex items-center gap-1.5">
//     <Label>Hero image</Label>
//     <FieldHint text="Shown as the city card thumbnail and the hero image on the city detail screen." />
//   </div>
export function FieldHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center text-[var(--color-muted-foreground)] cursor-help hover:text-[var(--color-foreground)] focus:outline-none focus:text-[var(--color-foreground)]"
        aria-label={text}
        role="img"
      >
        <Info className="h-3.5 w-3.5" />
      </span>
      <span
        // Tooltip body. Hidden by default (opacity-0, pointer-events-none),
        // revealed when the parent group is hovered or focus-within. Sized
        // generously so multi-sentence hints don't word-wrap awkwardly.
        role="tooltip"
        className="
          pointer-events-none
          absolute left-1/2 bottom-full z-50 mb-2 -translate-x-1/2
          w-64 max-w-[80vw]
          rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] text-[var(--color-popover-foreground)]
          px-3 py-2 text-xs leading-relaxed shadow-md
          opacity-0 transition-opacity duration-150
          group-hover:opacity-100 group-focus-within:opacity-100
        "
      >
        {text}
      </span>
    </span>
  )
}
