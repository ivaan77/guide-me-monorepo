'use client'
import dynamic from 'next/dynamic'

// Leaflet relies on `window`, so the actual map components must be loaded
// client-side only. We dynamic-import the inner wrapper to keep the form
// SSR-safe.
const MapInner = dynamic(() => import('./map-coords-picker-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]" />
  ),
})

type Props = {
  latitude: number
  longitude: number
  onChange: (next: { latitude: number; longitude: number }) => void
}

export function MapCoordsPicker(props: Props) {
  return <MapInner {...props} />
}
