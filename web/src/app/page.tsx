import { Mark } from './_components/Mark'
import { SiteHeader } from './_components/SiteHeader'
import { SiteFooter } from './_components/SiteFooter'
import { StatsBand } from './_components/StatsBand'
import { UsageBand } from './_components/UsageBand'

export default async function LandingPage() {
  return (
    // Layout intent — two behaviors:
    //   Mobile (< md): natural flow. Content scrolls if it exceeds the
    //     viewport. StatsBand + UsageBand + CTAs never get clipped by the
    //     footer regardless of screen height.
    //   Desktop (>= md): locked to viewport height with overflow-hidden.
    //     Hero fits in one perfect viewport, no scroll. Same as before.
    // The `min-h-screen` at the mobile end guarantees the footer sits at
    // the bottom of the viewport even on tall content pages where the
    // hero happens to be short.
    <main className="min-h-screen flex flex-col md:h-screen md:overflow-hidden">
      <SiteHeader />

      <section className="flex-1 flex items-center justify-center px-6 py-8 sm:py-10 min-h-0">
        <div className="max-w-3xl text-center py-4 md:py-0">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Mark size={72} />
          </div>
          <span
            style={{ fontFamily: 'var(--font-body)' }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-bright)] px-3 py-1 text-[11px] font-medium tracking-[0.14em] uppercase mb-5 sm:mb-6"
          >
            Coming soon · iOS &amp; Android
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] text-[var(--color-ink)] mb-4 sm:mb-5"
          >
            From here{' '}
            <span className="text-[var(--color-primary)]">to there.</span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--color-ink-2)] max-w-2xl mx-auto mb-6 sm:mb-8">
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
          <StatsBand />
          <UsageBand />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
