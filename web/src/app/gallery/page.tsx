import Image from 'next/image'
import type { Metadata } from 'next'
import type { PublicGalleryResponse } from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { SiteFooter } from '../_components/SiteFooter'
import { SiteHeader } from '../_components/SiteHeader'

export const metadata: Metadata = {
  title: 'Gallery · GuideMe',
  description:
    'A curated look at cities and places featured on GuideMe — the audio-guided walking tour app.',
}

// Static grid of the admin-curated featured items. No click behavior yet
// (no public web routes for individual cities/places). Add anchor links to
// mobile-app deep-links or dedicated pages when those exist.
export default async function GalleryPage() {
  const res = await publicFetch<PublicGalleryResponse>('/public/web/gallery')
  const items = res?.items ?? []

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="flex-1 px-6 sm:px-10 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
            className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] mb-3"
          >
            Featured on GuideMe
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-ink-2)] max-w-2xl mb-10">
            A hand-picked selection of the cities and places you'll find in the
            app. Every entry is narrated, mapped, and ready when you arrive.
          </p>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-line)] p-10 text-center text-[var(--color-ink-3)]">
              Nothing here yet. Come back soon.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <li
                  key={`${item.sourceType}:${item.id}`}
                  className="group rounded-lg overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)]"
                >
                  <div className="relative aspect-[4/3] bg-[var(--color-surface-2)]">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    )}
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-medium text-white">
                      {item.sourceType === 'city' ? 'City' : 'Place'}
                    </span>
                  </div>
                  <div className="p-4">
                    <p
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-lg font-bold text-[var(--color-ink)]"
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-sm text-[var(--color-ink-3)] mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
