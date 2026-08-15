'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mark } from './Mark'

export function SiteHeader() {
  // Hide the "Stories" nav link when the user is already inside the
  // blog (article, category, or index) — a redundant "Stories" pill on
  // the article page reads as an inconsistent affordance. The site
  // logo on the left still navigates home from any surface.
  const pathname = usePathname()
  const isOnBlog = pathname?.startsWith('/blog') ?? false

  return (
    <header className="px-6 sm:px-10 py-6 flex items-center gap-3">
      <Link href="/" className="flex items-center gap-3">
        <Mark size={32} variant="inverse" />
        <span
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xl font-bold tracking-tight text-[var(--color-ink)]"
        >
          Hey<em className="not-italic text-[var(--color-primary)]">Local</em>
        </span>
      </Link>
      {!isOnBlog && (
        <nav className="ml-auto flex items-center gap-6 text-sm font-semibold text-[var(--color-ink-2)]">
          <Link
            href="/blog"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            Stories
          </Link>
        </nav>
      )}
    </header>
  )
}
