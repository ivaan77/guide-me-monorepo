import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

type Props = {
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, backHref, actions }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Button asChild variant="ghost" size="icon">
            <Link href={backHref}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
