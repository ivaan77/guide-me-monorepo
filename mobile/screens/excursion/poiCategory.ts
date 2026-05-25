import { ShoppingBag, UtensilsCrossed, Wine } from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PoiCategory } from '@guide-me-app/core'

export type PoiCategoryMeta = {
  color: string
  icon: ComponentType<IconProps>
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryMeta> = {
  restaurant: { color: '#EA580C', icon: UtensilsCrossed },
  bar: { color: '#C026D3', icon: Wine },
  shopping: { color: '#16A34A', icon: ShoppingBag },
}
