import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import { usePostHog } from 'posthog-react-native'
import {
  ChevronRight,
  Cloud,
  CloudRain,
  Snowflake,
  Sun,
  Wind,
} from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import type {
  PublicLatLng,
  PublicWeather,
  WeatherSensitivity,
} from '@guide-me-app/core'
import { useWeather } from '../../hooks/useWeather'
import { SHADOW } from '../../constants/Sizes'
import { palette } from '../../constants/Colors'
import { WeatherDateSheet } from './WeatherDateSheet'

// ---- Recommendation decision matrix --------------------------------------
//
// Bucket the raw forecast into a small set of qualitative states so we don't
// have to translate 20 combinations of temp/rain/wind. Each state maps to a
// (sensitivity → tone/message) pair.

type WeatherState =
  | 'clear'
  | 'cloudy'
  | 'light-rain'
  | 'heavy-rain'
  | 'windy'
  | 'hot'
  | 'cold'
  | 'snowy'

// Precipitation buckets (mm/day):
//   0–2   → dry / "clear" or "cloudy" based on weatherCode
//   2–8   → "light-rain" — bring an umbrella advice
//   > 8   → "heavy-rain" — probably reschedule
const LIGHT_RAIN_MM = 2
const HEAVY_RAIN_MM = 8

// Wind buckets (km/h).
const WINDY_KMH = 40

// Temperature buckets (°C).
const HOT_C = 32
const COLD_C = 5

// WMO weather codes for snow bands.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

function classifyWeather(w: PublicWeather): WeatherState {
  if (SNOW_CODES.has(w.weatherCode)) return 'snowy'
  if (w.precipitationMm >= HEAVY_RAIN_MM) return 'heavy-rain'
  if (w.precipitationMm >= LIGHT_RAIN_MM) return 'light-rain'
  if (w.windKmh >= WINDY_KMH) return 'windy'
  if (w.tempMaxC >= HOT_C) return 'hot'
  if (w.tempMaxC < COLD_C) return 'cold'
  // Nothing extreme — fall back to clear/cloudy based on weatherCode.
  // WMO codes 0-1 are clear/mostly clear; 2-3 partly cloudy; 45-48 fog.
  if (w.weatherCode <= 1) return 'clear'
  return 'cloudy'
}

type Tone = 'positive' | 'neutral' | 'caution' | 'warning'

type Recommendation = {
  tone: Tone
  // Tamagui icons declare their color as a theme-token union rather than
  // plain string; the `any` is a scope-limited escape hatch just for the
  // Icon component reference itself, not leaked to callers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>
  headlineKey: string
  subKey?: string
}

// Sensitivity × weather matrix. Indoor is filtered out at the caller
// level — banner never renders for indoor excursions, so this table
// covers only outdoor + mixed.
function pickRecommendation(
  state: WeatherState,
  sensitivity: WeatherSensitivity,
): Recommendation {
  const isOutdoor = sensitivity === 'outdoor'
  switch (state) {
    case 'clear':
      return {
        tone: 'positive',
        icon: Sun,
        headlineKey: isOutdoor ? 'clearOutdoor' : 'clearMixed',
      }
    case 'cloudy':
      return { tone: 'neutral', icon: Cloud, headlineKey: 'cloudy' }
    case 'light-rain':
      return {
        tone: 'caution',
        icon: CloudRain,
        headlineKey: isOutdoor ? 'lightRainOutdoor' : 'lightRainMixed',
        subKey: 'lightRainSub',
      }
    case 'heavy-rain':
      return {
        tone: 'warning',
        icon: CloudRain,
        headlineKey: isOutdoor ? 'heavyRainOutdoor' : 'heavyRainMixed',
        subKey: 'heavyRainSub',
      }
    case 'windy':
      return {
        tone: 'caution',
        icon: Wind,
        headlineKey: isOutdoor ? 'windyOutdoor' : 'windyMixed',
      }
    case 'hot':
      return {
        tone: 'caution',
        icon: Sun,
        headlineKey: 'hot',
        subKey: 'hotSub',
      }
    case 'cold':
      return { tone: 'caution', icon: Snowflake, headlineKey: 'cold' }
    case 'snowy':
      return {
        tone: 'warning',
        icon: Snowflake,
        headlineKey: isOutdoor ? 'snowyOutdoor' : 'snowyMixed',
      }
  }
}

const TONE_STYLE: Record<
  Tone,
  { bg: string; border: string; icon: string; ink: string }
> = {
  positive: {
    bg: 'rgba(31, 169, 113, 0.10)',
    border: 'rgba(31, 169, 113, 0.35)',
    icon: palette.success,
    ink: palette.success,
  },
  neutral: {
    bg: 'rgba(74, 139, 245, 0.08)',
    border: 'rgba(74, 139, 245, 0.28)',
    icon: palette.bright,
    ink: palette.navy,
  },
  caution: {
    bg: 'rgba(255, 178, 63, 0.14)',
    border: 'rgba(255, 178, 63, 0.40)',
    icon: palette.amber,
    ink: palette.navy,
  },
  warning: {
    bg: 'rgba(229, 72, 77, 0.10)',
    border: 'rgba(229, 72, 77, 0.35)',
    icon: palette.danger,
    ink: palette.danger,
  },
}

type Props = {
  // Coord to fetch weather for — usually the excursion's first stop.
  coords?: PublicLatLng
  // Initial date the banner shows. Owned by parent state so it survives
  // banner re-renders.
  date: string
  onDateChange: (date: string) => void
  sensitivity: WeatherSensitivity
  // For analytics — carried in the `weather_checked` event so we can
  // slice engagement by excursion later.
  excursionId: string
}

// Compact banner + date affordance. The whole card is Pressable and opens
// the WeatherDateSheet. A small "Fri, Jul 12 ›" chip on the right of the
// header signals that the date is tappable.
//
// Silent-return-null cases:
//   - Missing coords or no forecast at all (fetch failed / 404).
// Every other classification renders — including cloudy — because when
// the user has explicitly opened the picker they want to see SOMETHING
// about that day, not have the banner vanish.
export function WeatherBanner({
  coords,
  date,
  onDateChange,
  sensitivity,
  excursionId,
}: Props) {
  const { t, i18n } = useTranslation()
  const posthog = usePostHog()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: weather, isError } = useWeather(coords, date)

  // Emit weather_checked once per (excursion, date, state). Fires whether
  // recommendation is positive or negative — the whole point is "did the
  // user see any weather signal?" Feeds admin dashboard.
  useEffect(() => {
    if (!weather || !posthog) return
    const state = classifyWeather(weather)
    posthog.capture('weather_checked', {
      excursion_id: excursionId,
      date,
      sensitivity,
      state,
      temp_max_c: Math.round(weather.tempMaxC),
      precip_mm: Math.round(weather.precipitationMm * 10) / 10,
      wind_kmh: Math.round(weather.windKmh),
    })
  }, [weather, posthog, excursionId, date, sensitivity])

  // Silent-null on every failure path: no coords, error state, no data, or
  // (subtle) the placeholder data is for a different date than the user
  // just picked. That last case protects against `keepPreviousData` +
  // network-drop scenarios where we'd otherwise show yesterday's forecast
  // under today's label. When in doubt, show nothing — better than lying.
  if (!coords) return null
  if (isError) return null
  if (!weather) return null
  if (weather.date !== date) return null

  const state = classifyWeather(weather)
  const rec = pickRecommendation(state, sensitivity)
  const style = TONE_STYLE[rec.tone]
  const Icon = rec.icon
  // Compact "Fri, Jul 12" affordance rendered on the right.
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))

  return (
    <>
      <Pressable onPress={() => setSheetOpen(true)} hitSlop={2}>
        <XStack
          items="center"
          gap="$3"
          p="$3"
          rounded="$5"
          borderWidth={1}
          style={{
            backgroundColor: style.bg,
            borderColor: style.border,
            ...SHADOW.subtle,
          }}
        >
          <YStack
            width={40}
            height={40}
            rounded={20}
            items="center"
            justify="center"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <Icon size={22} color={style.icon} />
          </YStack>
          <YStack flex={1} gap="$0.5" style={{ minWidth: 0 }}>
            <SizableText
              size="$4"
              fontFamily="$body"
              fontWeight="700"
              style={{ color: style.ink }}
              numberOfLines={2}
            >
              {t(`excursion.weather.${rec.headlineKey}`, {
                date: dateFmt,
                defaultValue: '',
              })}
            </SizableText>
            {rec.subKey && (
              <SizableText
                size="$3"
                fontFamily="$body"
                color="$colorPress"
                numberOfLines={2}
              >
                {t(`excursion.weather.${rec.subKey}`, {
                  defaultValue: '',
                })}
              </SizableText>
            )}
          </YStack>
          {/* Right column: temp + change-date chevron. Communicates
              "this whole card is tappable" without adding a second row. */}
          <YStack items="center" gap="$1">
            <SizableText
              size="$3"
              fontFamily="$body"
              fontWeight="700"
              style={{
                color: style.ink,
                fontVariant: ['tabular-nums'],
              }}
            >
              {Math.round(weather.tempMaxC)}°
            </SizableText>
            <ChevronRight size={16} color="$colorPress" />
          </YStack>
        </XStack>
      </Pressable>
      <WeatherDateSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={date}
        onChange={onDateChange}
      />
    </>
  )
}
