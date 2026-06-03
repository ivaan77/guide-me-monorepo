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

// react-hook-form returns NaN (not undefined) for empty number inputs when
// `valueAsNumber: true` is set, and Leaflet crashes on NaN coords. Defend
// against any caller passing those values through.
export function MapCoordsPicker(props: Props) {
  if (!Number.isFinite(props.latitude) || !Number.isFinite(props.longitude)) {
    return (
      <div className="h-64 w-full rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] flex items-center justify-center px-4 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Enter valid latitude and longitude to show the map.
        </p>
      </div>
    )
  }
  return <MapInner {...props} />
}
