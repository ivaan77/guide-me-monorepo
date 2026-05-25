'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type City = { slug: string; name: string }

const ALL = '__all__'

export function PlacesFilters({
  cities,
  currentCitySlug,
  currentCategory,
}: {
  cities: City[]
  currentCitySlug?: string
  currentCategory?: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const update = (key: 'citySlug' | 'category', value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value === ALL) params.delete(key)
    else params.set(key, value)
    router.push(`/discover/places?${params.toString()}`)
  }

  return (
    <div className="flex items-end gap-4 mb-4">
      <div className="flex flex-col gap-1.5 w-48">
        <Label className="text-xs">City</Label>
        <Select value={currentCitySlug ?? ALL} onValueChange={(v) => update('citySlug', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 w-48">
        <Label className="text-xs">Category</Label>
        <Select value={currentCategory ?? ALL} onValueChange={(v) => update('category', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
