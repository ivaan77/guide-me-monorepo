'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import type { AdminPlace } from '@guide-me-app/core'
import { deletePlaceAction, updatePlaceAction } from '@/actions/places'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'

export function PlacesTable({ places }: { places: AdminPlace[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = (p: AdminPlace) => {
    startTransition(async () => {
      const res = await updatePlaceAction(p.slug, { isEnabled: !p.isEnabled })
      if (!res.ok) {
        toast.error(`Failed to toggle ${p.slug}`, { description: res.error })
        return
      }
      router.refresh()
    })
  }

  const remove = (p: AdminPlace) => {
    if (!confirm(`Delete place "${p.slug}"?`)) return
    startTransition(async () => {
      const res = await deletePlaceAction(p.slug)
      if (!res.ok) {
        toast.error(`Cannot delete`, { description: res.error })
        return
      }
      toast.success(`Deleted ${p.slug}`)
      router.refresh()
    })
  }

  if (places.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No places match the current filters.
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
            <th className="px-4 py-2">City</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2 w-24">Enabled</th>
            <th className="px-4 py-2 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.slug} className="border-t border-[var(--color-border)] hover:bg-[var(--color-accent)]">
              <td className="px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
              </td>
              <td className="px-4 py-2 font-mono text-xs">{p.slug}</td>
              <td className="px-4 py-2 font-medium">{p.name.en}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)]">{p.citySlug}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)] capitalize">{p.category}</td>
              <td className="px-4 py-2">
                <Switch checked={p.isEnabled} onCheckedChange={() => toggle(p)} disabled={isPending} />
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/discover/places/${p.slug}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)} disabled={isPending}>
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
