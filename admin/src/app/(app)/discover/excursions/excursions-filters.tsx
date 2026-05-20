'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ALL = '__all__'

export function ExcursionsFilters({
  cities,
  currentCitySlug,
}: {
  cities: { slug: string; name: string }[]
  currentCitySlug?: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  return (
    <div className="flex items-end gap-4 mb-4">
      <div className="flex flex-col gap-1.5 w-48">
        <Label className="text-xs">City</Label>
        <Select
          value={currentCitySlug ?? ALL}
          onValueChange={(v) => {
            const params = new URLSearchParams(sp.toString())
            if (v === ALL) params.delete('citySlug')
            else params.set('citySlug', v)
            router.push(`/discover/excursions?${params.toString()}`)
          }}
        >
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
    </div>
  )
}
