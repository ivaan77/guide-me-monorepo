import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useAppTheme } from '../../providers/ThemeContext'

// Native iOS/Android tab bar with the system glass/blur look.
//
// On iOS 26 the bar gets Liquid Glass for free. On iOS 18 and earlier there
// is no glass, and without an explicit appearance the bar renders fully
// transparent — content scrolls underneath and the labels sit unreadable on
// top of whatever is behind them. `blurEffect` + `backgroundColor` give those
// versions a real material to sit on; `disableTransparentOnScrollEdge` stops
// UIKit dropping back to transparent once a list is scrolled to its edge.
export default function TabsLayout() {
  const { t } = useTranslation()
  const { c, resolved } = useAppTheme()

  // Memoize so the native UITabBar appearance API does not see new
  // references on incidental re-renders.
  const iconColor = useMemo(
    () => ({ default: c.textMuted, selected: c.primary }),
    [c.textMuted, c.primary],
  )
  const labelStyle = useMemo(
    () => ({
      default: { color: c.textMuted },
      selected: { color: c.primary },
    }),
    [c.textMuted, c.primary],
  )
  const selectedLabelStyle = useMemo(
    () => ({ color: c.primary }),
    [c.primary],
  )

  // Chrome material matches the system tab-bar look per theme; the explicit
  // backgroundColor is what actually renders on pre-26 iOS and on Android,
  // where blurEffect is ignored.
  const blurEffect = resolved === 'dark'
    ? 'systemChromeMaterialDark'
    : 'systemChromeMaterialLight'

  return (
    <NativeTabs
      iconColor={iconColor}
      labelStyle={labelStyle}
      blurEffect={blurEffect}
      backgroundColor={c.surface}
      disableTransparentOnScrollEdge
      rippleColor={c.surfaceMuted}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label selectedStyle={selectedLabelStyle}>
          {t('tabs.discover')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" selectedColor={c.primary} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites">
        <NativeTabs.Trigger.Label selectedStyle={selectedLabelStyle}>
          {t('tabs.favorites')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="heart.fill" md="favorite" selectedColor={c.primary} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stories">
        <NativeTabs.Trigger.Label selectedStyle={selectedLabelStyle}>
          {t('tabs.stories')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book.fill" md="book" selectedColor={c.primary} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label selectedStyle={selectedLabelStyle}>
          {t('tabs.profile')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" selectedColor={c.primary} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
