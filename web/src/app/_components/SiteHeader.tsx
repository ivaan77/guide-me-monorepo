import Link from 'next/link'
import { Mark } from './Mark'

export function SiteHeader() {
  return (
    <header className="px-6 sm:px-10 py-6 flex items-center gap-3">
      <Link href="/" className="flex items-center gap-3">
        <Mark size={32} />
        <span
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xl font-bold tracking-tight text-[var(--color-ink)]"
        >
          Guide<em className="not-italic text-[var(--color-primary)]">Me</em>
        </span>
      </Link>
    </header>
  )
}
