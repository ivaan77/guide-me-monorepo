'use client'
import { useEffect, useRef, useState } from 'react'
import L, { type LatLngExpression, type Map as LeafletMap } from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { Search, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker icon references PNGs via relative URLs that
// Webpack/Next can't resolve out of the box. Inline an SVG-based icon so
// no external image bundling is required.
const markerIcon = L.divIcon({
  className: 'guideme-marker',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path
        d="M14 0C6.27 0 0 6.27 0 14c0 9.5 12.07 24.06 13.07 25.18a1.25 1.25 0 0 0 1.86 0C15.93 38.06 28 23.5 28 14 28 6.27 21.73 0 14 0z"
        fill="#2A5BD7"
      />
      <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
    </svg>
  `,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
})

const DEFAULT_CENTER: LatLngExpression = [38.736946, -9.142685] // Lisbon

type Props = {
  latitude: number
  longitude: number
  onChange: (next: { latitude: number; longitude: number }) => void
}

export default function MapCoordsPickerInner({
  latitude,
  longitude,
  onChange,
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null)
  const hasCoords = latitude !== 0 || longitude !== 0
  // initialCenter/initialZoom are read ONCE on mount; never re-applied. The
  // map's runtime state is owned by Leaflet after that, so user pans and
  // zooms persist.
  const initialCenterRef = useRef<LatLngExpression>(
    hasCoords ? [latitude, longitude] : DEFAULT_CENTER,
  )
  const initialZoomRef = useRef<number>(hasCoords ? 14 : 4)

  // Recenter only when the change came from outside (manual input). Clicks
  // dispatched via setLastClickedRef are echoed back as new lat/lng props;
  // we skip the flyTo for those so the user's current zoom is preserved.
  const lastClickedRef = useRef<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    if (!hasCoords) return
    const map = mapRef.current
    if (!map) return
    const fromClick = lastClickedRef.current
    if (
      fromClick &&
      Math.abs(fromClick.lat - latitude) < 1e-9 &&
      Math.abs(fromClick.lng - longitude) < 1e-9
    ) {
      lastClickedRef.current = null
      return
    }
    map.flyTo([latitude, longitude], map.getZoom(), { duration: 0.4 })
  }, [latitude, longitude, hasCoords])

  return (
    <div className="flex flex-col gap-2">
      <SearchBox
        onPick={({ latitude, longitude }) => {
          // External-style change so the map flies to the result.
          onChange({ latitude, longitude })
        }}
      />
      <div className="h-64 w-full overflow-hidden rounded-md border border-[var(--color-border)]">
      <MapContainer
        ref={mapRef}
        center={initialCenterRef.current}
        zoom={initialZoomRef.current}
        scrollWheelZoom
        doubleClickZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoords && (
          <Marker position={[latitude, longitude]} icon={markerIcon} />
        )}
        <ClickHandler
          onChange={(next) => {
            lastClickedRef.current = { lat: next.latitude, lng: next.longitude }
            onChange(next)
          }}
        />
      </MapContainer>
      </div>
    </div>
  )
}

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

function SearchBox({
  onPick,
}: {
  onPick: (next: { latitude: number; longitude: number }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const ctl = new AbortController()
      abortRef.current = ctl
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`
        const res = await fetch(url, { signal: ctl.signal })
        if (!res.ok) throw new Error(`Nominatim ${res.status}`)
        const data = (await res.json()) as NominatimResult[]
        setResults(data)
        setOpen(true)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search a place or address…"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
              setOpen(false)
            }}
            className="absolute right-2 top-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (loading || results.length > 0) && (
        <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-background)] shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
              Searching…
            </li>
          )}
          {!loading &&
            results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) })
                    setQuery(r.display_name)
                    setOpen(false)
                  }}
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-muted)]"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

// Window within which a second click is treated as a double-click. Slightly
// longer than the OS default to feel forgiving on touchpads.
const DBL_CLICK_MS = 300

function ClickHandler({
  onChange,
}: {
  onChange: (next: { latitude: number; longitude: number }) => void
}) {
  const draggedRef = useRef(false)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    }
  }, [])

  useMapEvents({
    // Leaflet fires `click` at the end of a drag if the pointer barely
    // moved. Track movement between mousedown and the click to filter that.
    mousedown() {
      draggedRef.current = false
    },
    movestart() {
      draggedRef.current = true
    },
    click(e) {
      if (draggedRef.current) return
      // Wait DBL_CLICK_MS before placing the marker; if a dblclick fires
      // in that window we cancel and let the zoom happen instead.
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      const latlng = e.latlng
      pendingTimerRef.current = setTimeout(() => {
        onChange({ latitude: latlng.lat, longitude: latlng.lng })
        pendingTimerRef.current = null
      }, DBL_CLICK_MS)
    },
    dblclick() {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current)
        pendingTimerRef.current = null
      }
    },
  })
  return null
}
