'use client'
import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StopOption = {
  id: string
  label: string
}

type Props = {
  stops: StopOption[]
}

// Fixed top-right cluster of controls that helps editors navigate a long
// excursion form (Zagreb has ~30 stops, scroll fatigue is real). Holds three
// affordances:
//   - Scroll to top button (disabled when already at top)
//   - Scroll to bottom button (disabled when already at bottom)
//   - "Jump to stop" select that scrollIntoView's the chosen stop's card
// Top/bottom state is derived from window.scrollY vs document height so it
// updates live as the editor scrolls without polling.
export function ExcursionFormFloatingNav({ stops }: Props) {
  const [atTop, setAtTop] = useState(true)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const recompute = () => {
      const y = window.scrollY
      const viewport = window.innerHeight
      const total = document.documentElement.scrollHeight
      // 4px slack so subpixel/rounding doesn't flip the flag right at the edge.
      setAtTop(y <= 4)
      setAtBottom(y + viewport >= total - 4)
    }
    recompute()
    window.addEventListener('scroll', recompute, { passive: true })
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
    }
  }, [])

  const scrollTo = (y: number) => {
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const handleJump = (value: string) => {
    if (!value) return
    const el = document.getElementById(value)
    if (!el) return
    // Account for any fixed header at the top by offsetting up a bit.
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="fixed top-24 right-4 z-40 flex flex-col gap-2 items-end">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => scrollTo(0)}
        disabled={atTop}
        title="Scroll to top"
        className="shadow-md"
      >
        <ArrowUpToLine className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() =>
          scrollTo(document.documentElement.scrollHeight)
        }
        disabled={atBottom}
        title="Scroll to bottom"
        className="shadow-md"
      >
        <ArrowDownToLine className="h-4 w-4" />
      </Button>
      {stops.length > 0 && (
        <Select
          // Force re-mount per change so the trigger doesn't display the
          // last-picked label permanently. We treat the select as a one-shot
          // command, not state.
          value=""
          onValueChange={handleJump}
        >
          <SelectTrigger className="w-44 shadow-md bg-[var(--color-background)]">
            <SelectValue placeholder="Jump to stop…" />
          </SelectTrigger>
          <SelectContent>
            {stops.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
