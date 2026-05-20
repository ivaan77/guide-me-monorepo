'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import type { AdminExcursion } from '@guide-me-app/core'
import { deleteExcursionAction, updateExcursionAction } from '@/actions/excursions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'

export function ExcursionsTable({ excursions }: { excursions: AdminExcursion[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = (e: AdminExcursion) => {
    startTransition(async () => {
      const res = await updateExcursionAction(e.slug, { isEnabled: !e.isEnabled })
      if (!res.ok) {
        toast.error(`Failed to toggle ${e.slug}`, { description: res.error })
        return
      }
      router.refresh()
    })
  }

  const remove = (e: AdminExcursion) => {
    if (!confirm(`Delete excursion "${e.slug}"?`)) return
    startTransition(async () => {
      const res = await deleteExcursionAction(e.slug)
      if (!res.ok) {
        toast.error('Cannot delete', { description: res.error })
        return
      }
      toast.success(`Deleted ${e.slug}`)
      router.refresh()
    })
  }

  if (excursions.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No excursions match the current filter.
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
            <th className="px-4 py-2">Stops</th>
            <th className="px-4 py-2">POIs</th>
            <th className="px-4 py-2 w-24">Enabled</th>
            <th className="px-4 py-2 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {excursions.map((e) => (
            <tr
              key={e.slug}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-accent)]"
            >
              <td className="px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.image} alt="" className="h-10 w-10 rounded object-cover" />
              </td>
              <td className="px-4 py-2 font-mono text-xs">{e.slug}</td>
              <td className="px-4 py-2 font-medium">{e.name.en}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)]">{e.citySlug}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)]">{e.stops?.length ?? 0}</td>
              <td className="px-4 py-2 text-[var(--color-muted-foreground)]">{e.pois?.length ?? 0}</td>
              <td className="px-4 py-2">
                <Switch checked={e.isEnabled} onCheckedChange={() => toggle(e)} disabled={isPending} />
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/discover/excursions/${e.slug}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(e)} disabled={isPending}>
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
