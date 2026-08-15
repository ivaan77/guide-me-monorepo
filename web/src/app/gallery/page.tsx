import Image from 'next/image'
import type { Metadata } from 'next'
import type {
  PublicGalleryResponse,
  PublicPopularGalleryResponse,
  PublicPopularItem,
} from '@guide-me-app/core'
import { publicFetch } from '@/lib/api'
import { fmtCount, pluralize } from '@/lib/formatters'
import { SiteFooter } from '../_components/SiteFooter'
import { SiteHeader } from '../_components/SiteHeader'

export const metadata: Metadata = {
  title: 'Gallery · HeyLocal',
  description:
    'A curated look at cities and places featured on HeyLocal — the audio-guided walking tour app.',
}

// Two-section gallery:
//   1. "Popular right now" — data-driven, sourced from PostHog event counts.
//      Hidden when we have no popularity data (fresh install, PostHog down).
//   2. "Featured on HeyLocal" — admin-curated (editorial). Order set by the
//      admin, unchanged by usage. Always renders if items exist.
export default async function GalleryPage() {
  const [curatedRes, popularRes] = await Promise.all([
    publicFetch<PublicGalleryResponse>('/public/web/gallery'),
    publicFetch<PublicPopularGalleryResponse>('/public/web/popular-gallery'),
  ])
  const curated = curatedRes?.items ?? []
  const popular = popularRes?.items ?? []

  return (
    // Layout intent (see landing page for the same fix): the page flows
    // naturally instead of forcing 100vh. Short galleries (a few items)
    // fit in one viewport with no dead space below the grid; long
    // galleries scroll normally. Header sits at the top, footer at the
    // bottom of ACTUAL content, not the bottom of the screen.
    <main className="flex flex-col">
      <SiteHeader />

      <section className="px-6 sm:px-10 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
            className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] mb-3"
          >
            Gallery
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-ink-2)] max-w-2xl mb-8">
            Cities and places from the HeyLocal app — narrated, mapped, and
            ready when you arrive.
          </p>

          {popular.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)]"
                >
                  Popular right now
                </h2>
                <p className="text-xs text-[var(--color-ink-3)] uppercase tracking-[0.12em]">
                  Based on real usage
                </p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {popular.map((item) => (
                  <li key={`popular:${item.sourceType}:${item.id}`}>
                    <PopularCard item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)]"
              >
                Featured on HeyLocal
              </h2>
              <p className="text-xs text-[var(--color-ink-3)] uppercase tracking-[0.12em]">
                Hand-picked
              </p>
            </div>
            {curated.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--color-line)] p-10 text-center text-[var(--color-ink-3)]">
                Nothing here yet. Come back soon.
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {curated.map((item) => (
                  <li
                    key={`curated:${item.sourceType}:${item.id}`}
                    className="group rounded-lg overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)]"
                  >
                    <CardImage
                      src={item.image}
                      alt={item.title}
                      badge={item.sourceType === 'city' ? 'City' : 'Place'}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
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
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

function PopularCard({ item }: { item: PublicPopularItem }) {
  const badge =
    item.sourceType === 'city'
      ? 'City'
      : item.sourceType === 'excursion'
        ? 'Tour'
        : 'Place'
  const popularityLabel =
    item.popularityKind === 'walkers'
      ? pluralize(item.popularity, 'walker', 'walkers')
      : item.popularityKind === 'explorers'
        ? pluralize(item.popularity, 'explorer', 'explorers')
        : pluralize(item.popularity, 'save', 'saves')

  return (
    <div className="group rounded-lg overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)]">
      <CardImage
        src={item.image}
        alt={item.title}
        badge={badge}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="p-4">
        <p
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-base font-bold text-[var(--color-ink)]"
        >
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-[var(--color-ink-3)] mt-0.5 truncate">
            {item.subtitle}
          </p>
        )}
        <p className="mt-2 text-xs text-[var(--color-primary)] font-semibold tabular-nums">
          {fmtCount(item.popularity)} {popularityLabel}
        </p>
      </div>
    </div>
  )
}

function CardImage({
  src,
  alt,
  badge,
  sizes,
}: {
  src: string
  alt: string
  badge: string
  sizes: string
}) {
  return (
    <div className="relative aspect-[4/3] bg-[var(--color-surface-2)]">
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-medium text-white">
        {badge}
      </span>
    </div>
  )
}
