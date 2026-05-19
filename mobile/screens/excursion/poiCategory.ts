import { ShoppingBag, UtensilsCrossed, Wine } from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import type { PoiCategory } from '../../data/cities'

export type PoiCategoryMeta = {
  label: string
  color: string
  icon: ComponentType<IconProps>
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryMeta> = {
  restaurant: { label: 'Restaurant', color: '#EA580C', icon: UtensilsCrossed },
  bar: { label: 'Bar', color: '#C026D3', icon: Wine },
  shopping: { label: 'Shopping', color: '#16A34A', icon: ShoppingBag },
}
