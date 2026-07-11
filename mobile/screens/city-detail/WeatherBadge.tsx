import { Cloud, CloudRain, Snowflake, Sun, Wind } from '@tamagui/lucide-icons'
import { SizableText, XStack } from 'tamagui'
import type {
  PublicLatLng,
  PublicWeather,
  WeatherSensitivity,
} from '@guide-me-app/core'
import { useWeather } from '../../hooks/useWeather'
import { palette } from '../../constants/Colors'

// Compact "icon + temp" chip rendered on CityDetail excursion rows so a
// user browsing categories can eyeball whether today's weather fits an
// outdoor excursion before drilling in. Full recommendation copy stays on
// the ExcursionScreen preview — this is just an at-a-glance signal.
//
// Same failure discipline as WeatherBanner: renders nothing on any of
// (indoor sensitivity, missing coords, isError, no data, stale placeholder
// data whose date doesn't match today).
//
// Per-route precision, not per-city: badges use each excursion's own
// first-stop coord, so two routes in the same city CAN show different
// forecasts if their start points fall in different Open-Meteo grid
// cells (~1km resolution). That's intentional — a coastal route and a
// hilltop route in the same city have real micro-climate differences,
// especially for localized rain. If this starts confusing users, the
// fix is to switch to a shared city coord for all badges in one section
// (would need CityDetailScreen to pass city.coords down instead).

// Duplicated small classifier — banner has a richer version that also
// picks copy/tone, but the badge only needs an icon so keeping a local
// slimmed-down version avoids importing (and pulling into every row's
// bundle) the whole recommendation matrix.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])
const LIGHT_RAIN_MM = 2
const HEAVY_RAIN_MM = 8
const WINDY_KMH = 40
const HOT_C = 32
const COLD_C = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>

function pickIcon(w: PublicWeather): { Icon: IconComponent; color: string } {
  if (SNOW_CODES.has(w.weatherCode))
    return { Icon: Snowflake, color: palette.bright }
  if (w.precipitationMm >= HEAVY_RAIN_MM)
    return { Icon: CloudRain, color: palette.danger }
  if (w.precipitationMm >= LIGHT_RAIN_MM)
    return { Icon: CloudRain, color: palette.amber }
  if (w.windKmh >= WINDY_KMH) return { Icon: Wind, color: palette.amber }
  if (w.tempMaxC >= HOT_C) return { Icon: Sun, color: palette.amber }
  if (w.tempMaxC < COLD_C) return { Icon: Snowflake, color: palette.bright }
  if (w.weatherCode <= 1) return { Icon: Sun, color: palette.success }
  return { Icon: Cloud, color: palette.bright }
}

function todayIsoLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = {
  coords?: PublicLatLng
  sensitivity?: WeatherSensitivity
}

export function WeatherBadge({ coords, sensitivity }: Props) {
  // Indoor excursions get no badge at all — even a "5°" chip suggests the
  // weather matters, which is exactly the wrong signal here.
  if (sensitivity === 'indoor') return null

  const date = todayIsoLocal()
  const { data: weather, isError } = useWeather(coords, date)

  if (!coords) return null
  if (isError) return null
  if (!weather) return null
  // Placeholder-data guard: keepPreviousData could otherwise show
  // yesterday's forecast if the query is still resolving today's row.
  if (weather.date !== date) return null

  const { Icon, color } = pickIcon(weather)

  return (
    <XStack items="center" gap="$1">
      <Icon size={14} color={color} />
      <SizableText
        size="$2"
        fontFamily="$body"
        fontWeight="700"
        style={{ color, fontVariant: ['tabular-nums'] }}
      >
        {Math.round(weather.tempMaxC)}°
      </SizableText>
    </XStack>
  )
}
