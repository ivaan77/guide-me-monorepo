import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useAppTheme } from '../../providers/ThemeContext'

// Native iOS/Android tab bar with the system glass/blur look. The selected
// tint may visually drift slightly between tabs in iOS Expo Go (a known
// issue with `unstable-native-tabs` that may behave differently in a custom
// dev-client build). We prioritize the native glass effect over the minor
// color quirk for now.
export default function TabsLayout() {
  const { t } = useTranslation()
  const { c } = useAppTheme()

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

  return (
    <NativeTabs
      iconColor={iconColor}
      labelStyle={labelStyle}
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
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label selectedStyle={selectedLabelStyle}>
          {t('tabs.profile')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" selectedColor={c.primary} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
