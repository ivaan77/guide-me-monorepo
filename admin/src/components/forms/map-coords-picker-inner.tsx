'use client'
import { useEffect, useRef, useState } from 'react'
import {
  APIProvider,
  Circle,
  Map,
  Marker,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { Search, X } from 'lucide-react'

// Coordinate picker on the Google Maps JS API via @vis.gl/react-google-maps.
// Renders a click-to-place map with zoom/pan/street/satellite controls and
// a Places Autocomplete search box. Replaces the previous Leaflet + OSM
// tiles + Nominatim search — motivation was uneven street-level detail on
// Croatian roads and generally better POI data from Google.
//
// API key: NEXT_PUBLIC_GOOGLE_MAPS_KEY. Must be restricted to the admin's
// domains (Vercel prod URL + localhost) in Google Cloud Console — that's
// the actual security boundary; the key itself is client-side by design.

// Lisbon (matches the previous default); harmless — the map only opens
// here when the form has no coords yet.
const DEFAULT_CENTER = { lat: 38.736946, lng: -9.142685 }

export type SiblingCircle = {
  latitude: number
  longitude: number
  radiusMeters: number
  label?: string
}

type Props = {
  latitude: number
  longitude: number
  onChange: (next: { latitude: number; longitude: number }) => void
  // Optional: draw a translucent circle around the picked point at this
  // radius (in meters). Used by stop / sub-stop / fact editors to visualise
  // the geofence — updates live as the user types a new radius.
  radiusMeters?: number
  // Optional: additional circles drawn faintly for context. Used by the
  // stop editor to show sibling stops so overlapping radii are visible
  // before the user commits a change.
  siblings?: SiblingCircle[]
  // See MapCoordsPicker.Props for why this exists.
  persistKey?: string
}

// Module-level camera cache keyed by persistKey. Survives component
// unmount/remount so the user's zoom + center are preserved even when
// React tears the picker down on unrelated form changes. Cleared only
// on hard page reload; that's fine — we don't need cross-navigation
// persistence.
// (globalThis prefix because we import `Map` from @vis.gl above.)
const CAMERA_CACHE: globalThis.Map<
  string,
  { center: google.maps.LatLngLiteral; zoom: number }
> = new globalThis.Map()

export default function MapCoordsPickerInner(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!apiKey) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-4 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>{' '}
          in <code className="font-mono">admin/.env.local</code> to enable the
          map.
        </p>
      </div>
    )
  }
  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <PickerBody {...props} />
    </APIProvider>
  )
}

function PickerBody({
  latitude,
  longitude,
  onChange,
  radiusMeters,
  siblings,
  persistKey,
}: Props) {
  const hasCoords = latitude !== 0 || longitude !== 0
  const hasRadius =
    radiusMeters != null && Number.isFinite(radiusMeters) && radiusMeters > 0

  // Fully controlled camera. We own `center` and `zoom` in state and feed
  // them back to <Map>; `onCameraChanged` mirrors the user's pans and
  // zooms back into state. Initial value is pulled from CAMERA_CACHE if
  // this picker has been mounted before under the same persistKey — so
  // that transient unmount/remount cycles don't reset zoom.
  const [camera, setCamera] = useState<{
    center: google.maps.LatLngLiteral
    zoom: number
  }>(() => {
    const cached = persistKey ? CAMERA_CACHE.get(persistKey) : undefined
    if (cached) return cached
    return {
      center: hasCoords ? { lat: latitude, lng: longitude } : DEFAULT_CENTER,
      zoom: hasCoords ? 14 : 4,
    }
  })


  // When coords arrive from outside the map (search pick, manual input,
  // or the very first paint after coords load from the server), re-center
  // WITHOUT changing zoom. Skip during click echo — the click already
  // moved the marker; we don't want to move the camera too.
  const clickEchoRef = useRef(false)
  useEffect(() => {
    if (latitude === 0 && longitude === 0) return
    if (clickEchoRef.current) {
      clickEchoRef.current = false
      return
    }
    setCamera((prev) => {
      if (
        Math.abs(prev.center.lat - latitude) < 1e-9 &&
        Math.abs(prev.center.lng - longitude) < 1e-9
      ) {
        return prev
      }
      return { center: { lat: latitude, lng: longitude }, zoom: prev.zoom }
    })
  }, [latitude, longitude])

  return (
    <div className="flex flex-col gap-2">
      <SearchBox
        onPick={(next) => {
          onChange(next)
        }}
      />
      <div className="h-64 w-full overflow-hidden rounded-md border border-[var(--color-border)]">
        <Map
          center={camera.center}
          zoom={camera.zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl
          streetViewControl
          fullscreenControl
          zoomControl
          onCameraChanged={(ev) => {
            const next = {
              center: ev.detail.center,
              zoom: ev.detail.zoom,
            }
            // Persist across unmount/remount cycles keyed by picker id.
            if (persistKey) CAMERA_CACHE.set(persistKey, next)
            setCamera(next)
          }}
          onClick={(e) => {
            const ll = e.detail.latLng
            if (!ll) return
            // Tell the external-recenter effect to skip its work on the
            // next prop echo — we haven't moved the camera, only the pin.
            clickEchoRef.current = true
            onChange({ latitude: ll.lat, longitude: ll.lng })
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {hasCoords && (
            <Marker position={{ lat: latitude, lng: longitude }} />
          )}
          {hasCoords && hasRadius && (
            <Circle
              center={{ lat: latitude, lng: longitude }}
              radius={radiusMeters}
              strokeColor="#2A5BD7"
              strokeOpacity={0.9}
              strokeWeight={2}
              fillColor="#2A5BD7"
              fillOpacity={0.15}
              clickable={false}
            />
          )}
          {(siblings ?? []).map((s, i) => (
            <Circle
              // Include coords in the key so a coord edit re-mounts the
              // circle rather than trying to interpolate — google's Circle
              // lifecycle is happier with a fresh instance on big jumps.
              key={`${i}:${s.latitude.toFixed(6)}:${s.longitude.toFixed(6)}`}
              center={{ lat: s.latitude, lng: s.longitude }}
              radius={s.radiusMeters}
              strokeColor="#8B93A6"
              strokeOpacity={0.7}
              strokeWeight={1}
              fillColor="#8B93A6"
              fillOpacity={0.08}
              clickable={false}
            />
          ))}
        </Map>
      </div>
    </div>
  )
}

function SearchBox({
  onPick,
}: {
  onPick: (next: { latitude: number; longitude: number }) => void
}) {
  const places = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)
  const [query, setQuery] = useState('')

  // Attach Google's Autocomplete to our own <input> once the Places
  // library has loaded. Restricting `fields` keeps the response small
  // and cheap — we only need coords + a label.
  useEffect(() => {
    if (!places || !inputRef.current || autocomplete) return
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      const loc = place.geometry?.location
      if (!loc) return
      onPick({ latitude: loc.lat(), longitude: loc.lng() })
      setQuery(place.formatted_address ?? place.name ?? '')
    })
    setAutocomplete(ac)
  }, [places, autocomplete, onPick])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        // The picker is embedded in editor <form>s across the admin.
        // Pressing Enter to select an autocomplete suggestion would
        // otherwise submit the whole form. Block it — Google's
        // `place_changed` listener still fires on click/tap select.
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        placeholder={
          places ? 'Search a place or address…' : 'Loading Places…'
        }
        disabled={!places}
        // The Google Autocomplete widget adds a `.pac-container` to the
        // body — no need to render our own dropdown here.
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-60"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-2 top-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
