import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/forms/page-header'
import {
  AlertTriangle,
  Building2,
  Compass,
  Image as ImageIcon,
  Info,
  Mic,
  Store,
} from 'lucide-react'

export default function HelpPage() {
  return (
    <>
      <PageHeader
        title="Help & tutorial"
        description="How the admin maps to the mobile app, what each field does, and the gotchas worth knowing."
      />

      <div className="flex flex-col gap-6 max-w-3xl">
        <TocCard />

        <Section
          id="getting-started"
          icon={<Info className="h-4 w-4" />}
          title="Getting started"
        >
          <p>
            The admin manages three kinds of records: <strong>cities</strong>,{' '}
            <strong>places</strong>, and <strong>excursions</strong>. Mobile
            renders these as: the discover home (cities), a city detail screen
            (places, grouped by category), and an excursion runner (stops + POI
            references along the route).
          </p>
          <p>
            Each record has a <code>slug</code> — a stable, URL-safe identifier
            (lowercase letters, numbers, hyphens). Slugs cannot be changed after
            create; pick something readable like <code>lisbon</code> or{' '}
            <code>time-out-market</code>.
          </p>
          <p>
            Every visible record has an{' '}
            <code>isEnabled</code> toggle. When disabled, the record is hidden
            from the mobile app but kept in the database — useful for drafts or
            seasonal content.
          </p>
        </Section>

        <Section
          id="cities"
          icon={<Building2 className="h-4 w-4" />}
          title="Cities"
        >
          <p>
            <strong>Slug</strong> + <strong>image</strong> +{' '}
            <strong>name</strong> + <strong>country</strong> are required. The
            image is the hero shown on the discover home; name and country are{' '}
            <em>localized</em> — fill English first, German and Croatian are
            optional and fall back to English.
          </p>
          <p>
            <strong>Editor's pick</strong> is optional. If you fill the headline,
            you must also fill the tagline (the form blocks save otherwise).
            Both render on the mobile city card.
          </p>
          <p>
            <strong>City intro audio</strong> is optional. Upload one file per
            locale; mobile picks the best match for the user's language.
          </p>
          <p>
            <strong>Places to show in this city</strong> is the most important
            field on the city form. It's a curated list of place slugs that
            appear on the city detail screen, grouped by their category. Only
            visible after the city is saved — create the city, then come back to
            attach places.
          </p>
        </Section>

        <Section id="places" icon={<Store className="h-4 w-4" />} title="Places">
          <p>
            Places are the canonical record for every point of interest in a
            city. Cities reference them via{' '}
            <code>cityPlaceSlugs</code>; excursions reference them via{' '}
            <code>pois[].placeSlug</code>. The same place can appear in both —
            no duplication.
          </p>
          <p>
            <strong>Category</strong> is one of six values:{' '}
            <code>restaurant</code>, <code>cafe</code>, <code>bar</code>,{' '}
            <code>shopping</code>, <code>event</code>, <code>park</code>.
          </p>
          <p>
            <strong>Sub-category</strong> is free-text (localized) and optional.
            Use it to group same-category items on the mobile city screen — e.g.{' '}
            <code>Japanese</code> / <code>Pizza</code> /{' '}
            <code>Recommended</code> for restaurants. Items in a category
            without a sub-category fall into "Other" at the bottom.
          </p>
          <p>
            <strong>Coords</strong> are optional but{' '}
            <em>required for the mobile map to render the pin</em>. Click on the
            map or paste lat/lng manually. The Stats page surfaces places that
            are still missing coords.
          </p>
          <p>
            <strong>Audio guide</strong> on a place is optional. When set, the
            mobile place detail screen shows an audio player.
          </p>
        </Section>

        <Section
          id="excursions"
          icon={<Compass className="h-4 w-4" />}
          title="Excursions"
        >
          <p>
            An excursion is a tour through a city — a sequence of{' '}
            <strong>stops</strong> with optional <strong>POI</strong> detours,
            and optional <strong>interesting facts</strong> narration.
          </p>
          <div className="flex flex-col gap-2">
            <p>
              <strong>Stops</strong> are excursion-specific. Each stop has its
              own slug, name, description, image, gallery, and an optional
              localized audio narration. <code>Order</code> controls position
              in the unified stops + POIs list on mobile.
            </p>
            <p>
              <strong>Trigger radius</strong> (meters, optional) overrides the
              default 30m arrival geofence on a per-stop basis. Increase it for
              stops in dense urban areas where GPS is jittery; tighten for
              precise photo-ops.
            </p>
          </div>
          <p>
            <strong>POIs</strong> are references to existing places in this
            city. To add a POI, first create the place under <Link href="/discover/places" className="underline">/discover/places</Link>{' '}
            then check it in this excursion. Order controls where it interleaves
            with stops in the mobile list.
          </p>
          <p>
            <strong>Interesting facts</strong> are short audio cards tied to the
            excursion as a whole, not any particular stop. Each card needs a
            slug, a localized title, and at least one audio file in any locale.
            Mobile renders them as a horizontal list of playable cards.
          </p>
        </Section>

        <Section
          id="uploads"
          icon={<ImageIcon className="h-4 w-4" />}
          title="Images and audio"
        >
          <p>
            All assets are uploaded to a Google Cloud Storage bucket. Image
            inputs accept JPG, PNG, WEBP; audio inputs accept MP3, M4A, WAV.
            Files are namespaced by entity slug so re-uploads overwrite cleanly.
          </p>
          <p>
            Localized audio (stops, interesting facts, city/place audio) has
            three tabs — <code>en</code>, <code>de</code>, <code>hr</code>.
            English is recommended; other locales fall back to English at read
            time. You can leave a locale empty.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Heads up: uploads happen synchronously on save. Don't navigate away
            during an upload or it'll abort.
          </p>
        </Section>

        <Section
          id="audio"
          icon={<Mic className="h-4 w-4" />}
          title="Audio playback on mobile"
        >
          <p>
            The mobile app picks one URL per audio field based on the device
            locale, with fallback chain: requested locale →{' '}
            <code>en</code> → any other populated locale → silent. Upload
            English first to guarantee a fallback target.
          </p>
          <p>
            Stops with audio show a play button with a progress ring during
            navigation. Interesting facts and city/place audio reuse the same
            player component.
          </p>
        </Section>

        <Section
          id="gotchas"
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Gotchas"
        >
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>
              <strong>Save the city first</strong> before trying to attach
              places — the place picker only appears in edit mode.
            </li>
            <li>
              <strong>Deleting a place that's referenced</strong> by a city or
              excursion is blocked with a 409 error. The toast tells you which
              entity references it. Unlink first, then delete.
            </li>
            <li>
              <strong>Deleting a city with child excursions or places</strong>{' '}
              is also blocked. Delete or reassign the children first.
            </li>
            <li>
              <strong>POI place must belong to the same city</strong> as the
              excursion. The api rejects cross-city POI references.
            </li>
            <li>
              <strong>Coords are optional on places</strong> but required for
              the map pin to render. The Stats page flags places without
              coords.
            </li>
            <li>
              <strong>Excursion POIs picker hides if no city is chosen.</strong>{' '}
              Set the city dropdown above before picking POIs.
            </li>
            <li>
              <strong>Empty optional LocalizedString fields get dropped on
              save.</strong>{' '}
              If you clear an English field and leave the German one populated,
              the German one is dropped too (English is the anchor).
            </li>
          </ul>
        </Section>
      </div>
    </>
  )
}

function TocCard() {
  const items: { id: string; label: string }[] = [
    { id: 'getting-started', label: 'Getting started' },
    { id: 'cities', label: 'Cities' },
    { id: 'places', label: 'Places' },
    { id: 'excursions', label: 'Excursions' },
    { id: 'uploads', label: 'Images and audio' },
    { id: 'audio', label: 'Audio playback' },
    { id: 'gotchas', label: 'Gotchas' },
  ]
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-2">
        <p className="text-sm font-medium">Sections</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="underline">
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-8">
      <CardContent className="pt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="flex flex-col gap-3 text-sm leading-6 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-[var(--color-muted)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
