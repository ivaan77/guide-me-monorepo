import { useMemo } from 'react'
import { Linking, Pressable, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { X } from '@tamagui/lucide-icons'
import { SizableText, XStack, YStack } from 'tamagui'
import { BottomSheet } from '../../common/BottomSheet'
import { useAppTheme } from '../../providers/ThemeContext'

// BottomSheet-based date picker for the WeatherBanner. Replaces the
// original inline chip strip (which ate ~90pt of vertical space above
// the banner). Same 7-day grid, now behind a tap on the banner.

const DAYS_AHEAD = 7

type Props = {
  visible: boolean
  onClose: () => void
  value: string // yyyy-mm-dd
  onChange: (date: string) => void
}

export function WeatherDateSheet({ visible, onClose, value, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const { c } = useAppTheme()

  // Precompute the 7 date strings + display labels. Locale-aware short
  // weekday so hr/de get "Sub"/"Mo" instead of "Sat"/"Mon".
  const options = useMemo(() => {
    const now = new Date()
    const weekdayFmt = new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
    })
    const monthDayFmt = new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
    })
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() + i)
      // ISO yyyy-mm-dd from local components — Open-Meteo expects local
      // date because we asked for timezone=auto.
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label =
        i === 0
          ? t('excursion.weather.today', { defaultValue: 'Today' })
          : i === 1
            ? t('excursion.weather.tomorrow', { defaultValue: 'Tomorrow' })
            : weekdayFmt.format(d)
      return { iso, label, sub: monthDayFmt.format(d) }
    })
  }, [i18n.language, t])

  return (
    <BottomSheet visible={visible} onClose={onClose} heightRatio={0.5}>
      <YStack flex={1}>
        <XStack items="center" gap="$2" px="$4" pt="$3" pb="$3">
          <SizableText
            flex={1}
            size="$6"
            fontFamily="$heading"
            fontWeight="700"
            color={c.text as any}
          >
            {t('excursion.weather.pickDate', {
              defaultValue: 'When are you going?',
            })}
          </SizableText>
          <Pressable onPress={onClose} hitSlop={8}>
            <YStack
              width={32}
              height={32}
              rounded={16}
              bg={c.surfaceMuted as any}
              items="center"
              justify="center"
            >
              <X size={16} color={c.text as any} />
            </YStack>
          </Pressable>
        </XStack>

        {/* Vertical list of chips — comfortable to tap on any screen and
            avoids horizontal scroll confusion. Each row shows the day-of-
            week label and the calendar date. */}
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
          {options.map((opt) => {
            const isSelected = opt.iso === value
            return (
              <Pressable
                key={opt.iso}
                onPress={() => {
                  onChange(opt.iso)
                  onClose()
                }}
                hitSlop={4}
              >
                <XStack
                  items="center"
                  justify="space-between"
                  px="$4"
                  py="$3"
                  rounded="$5"
                  borderWidth={1}
                  style={{
                    backgroundColor: isSelected ? c.primary : 'transparent',
                    borderColor: isSelected ? c.primary : c.border,
                  }}
                >
                  <SizableText
                    size="$4"
                    fontFamily="$body"
                    fontWeight="700"
                    style={{
                      color: isSelected ? c.onBrand : c.text,
                    }}
                  >
                    {opt.label}
                  </SizableText>
                  <SizableText
                    size="$3"
                    fontFamily="$body"
                    fontWeight="600"
                    style={{
                      color: isSelected
                        ? 'rgba(255,255,255,0.85)'
                        : c.textMuted,
                    }}
                  >
                    {opt.sub}
                  </SizableText>
                </XStack>
              </Pressable>
            )
          })}
        </ScrollView>
        {/* Open-Meteo attribution — required by their CC-BY 4.0 license.
            Placed inside the date sheet (rather than on the always-visible
            banner) because the user opts in here to see weather details;
            the banner itself stays uncluttered. Tap opens the source URL
            in the system browser. */}
        <Pressable
          onPress={() =>
            Linking.openURL('https://open-meteo.com/').catch(() => {})
          }
          hitSlop={6}
        >
          <YStack items="center" py="$2.5" px="$4">
            <SizableText
              size="$1"
              fontFamily="$body"
              color={c.textMuted as any}
              style={{ letterSpacing: 0.4 }}
            >
              {t('excursion.weather.attribution', {
                defaultValue: 'Weather data by Open-Meteo',
              })}
            </SizableText>
          </YStack>
        </Pressable>
      </YStack>
    </BottomSheet>
  )
}
