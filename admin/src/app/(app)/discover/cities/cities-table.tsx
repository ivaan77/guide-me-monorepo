'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import type { AdminCity } from '@guide-me-app/core'
import { deleteCityAction, updateCityAction } from '@/actions/cities'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'

export function CitiesTable({ cities }: { cities: AdminCity[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = (city: AdminCity) => {
    startTransition(async () => {
      const res = await updateCityAction(city.slug, {
        isEnabled: !city.isEnabled,
      })
      if (!res.ok) {
        toast.error(`Failed to toggle ${city.slug}`, { description: res.error })
        return
      }
      toast.success(
        `${city.slug} ${!city.isEnabled ? 'enabled' : 'disabled'}`,
      )
      router.refresh()
    })
  }

  const remove = (city: AdminCity) => {
    if (!confirm(`Delete city "${city.slug}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteCityAction(city.slug)
      if (!res.ok) {
        toast.error(`Cannot delete ${city.slug}`, { description: res.error })
        return
      }
      toast.success(`Deleted ${city.slug}`)
      router.refresh()
    })
  }

  if (cities.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No cities yet. Create one to get started.
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-muted)] text-left">
          <tr>
            <th className="px-4 py-2 w-16"></th>
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Name (EN)</th>
            <th className="px-4 py-2">Country (EN)</th>
            <th className="px-4 py-2 w-24">Enabled</th>
            <th className="px-4 py-2 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr
              key={city.slug}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-accent)]"
            >
              <td className="px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={city.image}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              </td>
              <td className="px-4 py-2 font-mono text-xs">{city.slug}</td>
              <td className="px-4 py-2 font-medium">{city.name.en}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)]">
                {city.country.en}
              </td>
              <td className="px-4 py-2">
                <Switch
                  checked={city.isEnabled}
                  onCheckedChange={() => toggle(city)}
                  disabled={isPending}
                />
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/discover/cities/${city.slug}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(city)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
