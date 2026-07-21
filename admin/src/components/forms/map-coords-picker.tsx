'use client'
import MapInner from './map-coords-picker-inner'

// @vis.gl/react-google-maps tolerates SSR (no window access during render;
// the maps script only loads client-side via APIProvider), so we import
// the inner picker directly. Historically this went through next/dynamic,
// but that added a Suspense boundary that unmounted every picker on the
// page whenever any form field changed — breaking the map's controlled
// camera state and resetting zoom on click.

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
  // Optional live-updating circle around the picked point (meters).
  radiusMeters?: number
  // Optional context circles (e.g. sibling stops).
  siblings?: SiblingCircle[]
  // Stable identifier used to remember camera state (zoom + center) across
  // unmount/remount cycles. Some form state changes cause React to
  // unmount every picker on the page; without persistence the zoom snaps
  // back to the initial value on every remount. Pass a string that's
  // stable for the lifetime of this picker (e.g. `stop-${idx}`).
  persistKey?: string
}

// react-hook-form returns NaN (not undefined) for empty number inputs when
// `valueAsNumber: true` is set, and google.maps crashes on NaN coords.
// Sanitise here so the inner map component sees valid finite numbers.
//
// CRITICAL: this MUST NOT switch the rendered element type between renders
// (e.g. between <div/> fallback and <MapInner/>). Doing so unmounts and
// remounts the map on every transient NaN, and each remount resets the
// controlled camera state (including zoom) back to the initial values.
// A click's two `setValue` calls can produce a render where one coord is
// still NaN — historically that flipped the fallback branch and reset
// zoom. Always render <MapInner/>, coercing NaN to 0.
export function MapCoordsPicker(props: Props) {
  const safeLat = Number.isFinite(props.latitude) ? props.latitude : 0
  const safeLng = Number.isFinite(props.longitude) ? props.longitude : 0
  return (
    <MapInner {...props} latitude={safeLat} longitude={safeLng} />
  )
}
