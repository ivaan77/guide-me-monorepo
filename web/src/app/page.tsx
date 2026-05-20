export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-[var(--color-brand)] uppercase mb-6">
            Guide Me
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-6">
            Audio-guided city tours,{' '}
            <span className="text-[var(--color-brand)]">in your pocket.</span>
          </h1>
          <p className="text-lg text-[var(--color-muted)] mb-10">
            Discover cities through curated walking tours, hand-picked
            restaurants, bars, and shops — narrated, mapped, and ready when
            you are.
          </p>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-[var(--color-muted)]">
            <span className="size-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
            Coming soon to iOS &amp; Android
          </div>
        </div>
      </section>
      <footer className="px-6 py-8 text-center text-xs text-[var(--color-muted)] border-t border-white/5">
        © {new Date().getFullYear()} Guide Me. All rights reserved.
      </footer>
    </main>
  )
}
