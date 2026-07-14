'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Floating button that appears once the user has scrolled past a
// threshold. Smooth-scroll to top on click. Bottom-right, safe on both
// desktop and mobile (24px from each edge on mobile via responsive
// bottom offset).
//
// Watching window scroll from a client component is fine — the button
// itself is a leaf so the parent (BlogArticle) can stay a server
// component.

// Show once the user has passed 60% of the viewport height. Tunable —
// too low and the button flashes on every scroll; too high and users
// don't discover it. 60vh is a sensible middle.
const THRESHOLD_RATIO = 0.6

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (): void => {
      const threshold = window.innerHeight * THRESHOLD_RATIO
      setVisible(window.scrollY > threshold)
    }
    handler()
    // passive listener since we never call preventDefault — lets the
    // browser use fast-scroll paths.
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler, { passive: true })
    return (): void => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  const scrollUp = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={`fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
