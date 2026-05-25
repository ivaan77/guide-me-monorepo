export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-10 py-6 flex items-center gap-3">
        <Mark size={32} />
        <span
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-xl font-bold tracking-tight text-[var(--color-ink)]"
        >
          Guide<em className="not-italic text-[var(--color-primary)]">Me</em>
        </span>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="max-w-3xl text-center">
          <div className="flex justify-center mb-10">
            <Mark size={96} />
          </div>
          <span
            style={{ fontFamily: 'var(--font-body)' }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-bright)] px-3 py-1 text-[11px] font-medium tracking-[0.14em] uppercase mb-8"
          >
            Coming soon · iOS &amp; Android
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] text-[var(--color-ink)] mb-6"
          >
            From here{' '}
            <span className="text-[var(--color-primary)]">to there.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-ink-2)] max-w-2xl mx-auto mb-10">
            Audio-guided walking tours, hand-picked restaurants, bars, and shops
            — narrated, mapped, and ready when you are.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#notify"
              style={{ fontFamily: 'var(--font-display)' }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-navy)] font-semibold hover:bg-[var(--color-bright)] transition-colors"
            >
              Notify me on launch
            </a>
            <a
              href="#learn"
              style={{ fontFamily: 'var(--font-display)' }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--color-line-strong)] text-[var(--color-ink)] font-semibold hover:bg-[var(--color-surface)] transition-colors"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-8 border-t border-[var(--color-line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--color-ink-3)]">
        <span>© {new Date().getFullYear()} GuideMe. All rights reserved.</span>
        <span>Made for explorers.</span>
      </footer>
    </main>
  )
}

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GuideMe mark"
    >
      <path
        d="M10 50 C 22 50, 30 46, 36 34 S 46 14, 54 14"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="54" cy="14" r="6.5" fill="var(--color-amber)" />
      <circle cx="10" cy="50" r="2.5" fill="var(--color-primary)" opacity=".85" />
    </svg>
  )
}
