import {
  type PublicLatLng,
  type PublicWeatherResponse,
  PublicPath,
} from '@guide-me-app/core'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet, ApiError } from '../lib/api'

// Fetches Open-Meteo forecast for one (lat, lng, date) via the API.
// Returns `null` when the API responds 404 (no forecast for that day) so
// the caller can distinguish "unavailable" from "still loading" without
// treating a 404 as an error state.
//
// Server caches 1h per (rounded-coord, date); this hook holds React
// Query's copy for 30 minutes so navigating in/out of the excursion
// preview doesn't refetch.

const STALE_MS = 30 * 60 * 1000

export function useWeather(
  coords: PublicLatLng | undefined,
  date: string | undefined,
) {
  return useQuery({
    // Rounding coords to 4 decimals matches the server-side cache key
    // rounding — same nearby stops share the same query entry too.
    queryKey: [
      'weather',
      coords ? Math.round(coords.latitude * 10000) / 10000 : null,
      coords ? Math.round(coords.longitude * 10000) / 10000 : null,
      date,
    ],
    enabled: !!coords && !!date,
    staleTime: STALE_MS,
    // Keep the previous forecast visible while a new date is being fetched
    // — otherwise the banner would flash "empty" every time the user
    // picks a different day, and if the new fetch fails the banner stays
    // gone with no indication of why. keepPreviousData means `data` holds
    // the prior forecast until the new one lands successfully.
    placeholderData: keepPreviousData,
    // React Query auto-retries by default; skip it on 404 since the server
    // already retried the upstream request and hard-404'd. Repeated retries
    // would just waste bandwidth. Other errors (network flap, 5xx) still
    // retry once so a transient blip doesn't leave the banner stuck empty.
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false
      return failureCount < 1
    },
    queryFn: async ({ signal }) => {
      try {
        const res = await apiGet<PublicWeatherResponse>(
          `${PublicPath.Weather.forecast}?lat=${coords!.latitude}&lng=${coords!.longitude}&date=${date}`,
          { signal },
        )
        return res.weather
      } catch (err) {
        // Treat 404 as "no forecast available", not an error — the caller
        // renders a graceful "weather unavailable" state or hides the
        // banner altogether. Any other failure (500, network) propagates.
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
  })
}
