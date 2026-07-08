import type { ReactNode } from 'react'

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: ReactNode
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 sm:px-10 py-12 sm:py-16 text-[var(--color-ink-2)] leading-relaxed">
      <h1
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] mb-3"
      >
        {title}
      </h1>
      <p className="text-sm text-[var(--color-ink-3)] mb-10">
        Effective {effectiveDate}
      </p>
      <div className="space-y-6 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--color-ink)] [&_h2]:font-[var(--font-display)] [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul>li]:mb-1 [&_a]:text-[var(--color-bright)] [&_a:hover]:underline [&_strong]:text-[var(--color-ink)]">
        {children}
      </div>
    </article>
  )
}
