import { PublicPath, type WalkingDirectionsResponse } from '@guide-me-app/core'
import type { PublicLatLng as LatLng } from '@guide-me-app/core'
import { API_URL } from '../config/env'

export type Route = {
  polyline: LatLng[]
  distanceMeters: number
  durationSeconds: number
  cached: boolean
}

export async function fetchWalkingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<Route | null> {
  const params = new URLSearchParams({
    originLat: String(origin.latitude),
    originLng: String(origin.longitude),
    destLat: String(destination.latitude),
    destLng: String(destination.longitude),
  })

  try {
    const res = await fetch(
      `${API_URL}${PublicPath.Directions.walk}?${params.toString()}`,
    )
    if (!res.ok) {
      console.warn(
        '[directions] backend returned',
        res.status,
        await res.text().catch(() => ''),
      )
      return straightLineFallback(origin, destination)
    }
    const json = (await res.json()) as WalkingDirectionsResponse
    return {
      polyline: json.polyline,
      distanceMeters: json.distanceMeters,
      durationSeconds: json.durationSeconds,
      cached: json.cached,
    }
  } catch (err) {
    console.warn('[directions] fetch threw', err)
    return straightLineFallback(origin, destination)
  }
}

function straightLineFallback(origin: LatLng, destination: LatLng): Route {
  return {
    polyline: [origin, destination],
    distanceMeters: haversineMeters(origin, destination),
    durationSeconds: Math.round(haversineMeters(origin, destination) / 1.4),
    cached: false,
  }
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Approximates remaining distance along a polyline from the user's current
// location to the last vertex. Finds the polyline segment closest to the user,
// then sums: (distance from user to projection on that segment) + (lengths of
// all segments after it). Accurate enough for foot navigation when the user
// roughly tracks the route.
export function remainingMetersAlongPolyline(
  user: LatLng,
  polyline: LatLng[],
): number {
  if (polyline.length < 2) return 0

  let bestSegmentIndex = 0
  let bestDistance = Infinity
  let bestProjection: LatLng = polyline[0]

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]
    const b = polyline[i + 1]
    const { projection, distance } = projectOntoSegment(user, a, b)
    if (distance < bestDistance) {
      bestDistance = distance
      bestSegmentIndex = i
      bestProjection = projection
    }
  }

  let remaining = haversineMeters(bestProjection, polyline[bestSegmentIndex + 1])
  for (let i = bestSegmentIndex + 1; i < polyline.length - 1; i++) {
    remaining += haversineMeters(polyline[i], polyline[i + 1])
  }
  return remaining
}

// Returns a polyline that starts at `user`, then continues along `polyline`
// from the closest point onwards. Use to render a route that visually anchors
// to the user's pin and shrinks as they walk.
export function trimPolylineFromUser(
  user: LatLng,
  polyline: LatLng[],
): LatLng[] {
  if (polyline.length < 2) return polyline

  let bestSegmentIndex = 0
  let bestDistance = Infinity
  let bestProjection: LatLng = polyline[0]

  for (let i = 0; i < polyline.length - 1; i++) {
    const { projection, distance } = projectOntoSegment(
      user,
      polyline[i],
      polyline[i + 1],
    )
    if (distance < bestDistance) {
      bestDistance = distance
      bestSegmentIndex = i
      bestProjection = projection
    }
  }

  return [user, bestProjection, ...polyline.slice(bestSegmentIndex + 1)]
}

function projectOntoSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): { projection: LatLng; distance: number } {
  // Treat short distances as a locally-flat plane (equirectangular projection).
  // Accurate enough for foot-navigation distances (sub-km).
  const latRef = (a.latitude + b.latitude) / 2
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos((latRef * Math.PI) / 180)

  const ax = a.longitude * mPerDegLng
  const ay = a.latitude * mPerDegLat
  const bx = b.longitude * mPerDegLng
  const by = b.latitude * mPerDegLat
  const px = p.longitude * mPerDegLng
  const py = p.latitude * mPerDegLat

  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  const projX = ax + t * dx
  const projY = ay + t * dy

  const projection: LatLng = {
    longitude: projX / mPerDegLng,
    latitude: projY / mPerDegLat,
  }
  const distance = Math.hypot(px - projX, py - projY)
  return { projection, distance }
}
