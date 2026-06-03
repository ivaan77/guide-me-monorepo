import {
  CalendarDays,
  Coffee,
  ShoppingBag,
  Trees,
  UtensilsCrossed,
  Wine,
} from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PoiCategory } from '@guide-me-app/core'

export type PoiCategoryMeta = {
  color: string
  icon: ComponentType<IconProps>
}

// Color picks meant to be distinguishable on a busy map: warm food, cool
// drink, green nature, blue events, etc. Keep contrast with the white pin
// background in ExcursionScreen.
export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryMeta> = {
  restaurant: { color: '#EA580C', icon: UtensilsCrossed },
  cafe: { color: '#92400E', icon: Coffee },
  bar: { color: '#C026D3', icon: Wine },
  shopping: { color: '#16A34A', icon: ShoppingBag },
  event: { color: '#2563EB', icon: CalendarDays },
  park: { color: '#15803D', icon: Trees },
}
