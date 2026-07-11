import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="px-6 sm:px-10 py-8 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--color-ink-3)]">
      <span>© {new Date().getFullYear()} GuideMe. All rights reserved.</span>
      <nav className="flex items-center gap-5">
        <Link href="/gallery" className="hover:text-[var(--color-ink-2)] transition-colors">
          Gallery
        </Link>
        <Link href="/terms" className="hover:text-[var(--color-ink-2)] transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-[var(--color-ink-2)] transition-colors">
          Privacy
        </Link>
        <span>Made for explorers.</span>
      </nav>
    </footer>
  )
}
