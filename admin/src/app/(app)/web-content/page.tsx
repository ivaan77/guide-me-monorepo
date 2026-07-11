import { listGalleryAction } from '@/actions/web-content'
import { PageHeader } from '@/components/forms/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { GalleryEditor } from './gallery-editor'
import { Image as ImageIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WebContentPage() {
  const items = await listGalleryAction()
  return (
    <>
      <PageHeader
        title="Web content"
        description="Curate what appears on the public marketing site. Right now that's the featured gallery — pick which cities and places to spotlight, and their order."
      />
      <Card>
        <CardContent className="pt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <p className="text-sm font-medium">Featured gallery</p>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Featured items appear on the public site sorted by the order below.
            Disabled cities and places never surface on the web even if flagged
            — enable them first if you want them visible.
          </p>
          <GalleryEditor initial={items} />
        </CardContent>
      </Card>
    </>
  )
}
