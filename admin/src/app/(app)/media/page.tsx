import { PageHeader } from '@/components/forms/page-header'
import { MediaLibrary } from './media-library'

// Media page: upload new images and browse everything the bucket has.
// Server-side rendered shell for consistency with the other admin
// pages; the interactive bits (tabs, upload, list refresh) live in the
// MediaLibrary client component below.
//
// Data fetching is entirely inside the client component — the initial
// bucket list and gallery-used list are fetched on mount via the
// /api/media/list route and the listImageGalleryAction server action.
// Both are auth-gated and cheap enough that we don't need to preload
// them on the server.

export const dynamic = 'force-dynamic'

export default function MediaPage() {
  return (
    <>
      <PageHeader
        title="Media"
        description="Upload images and browse everything in the bucket. Orphans (images not linked from any content doc) are flagged."
      />
      <MediaLibrary />
    </>
  )
}
