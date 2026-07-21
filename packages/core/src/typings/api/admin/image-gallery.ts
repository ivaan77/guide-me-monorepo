// Image gallery: distinct image URLs already referenced by any content
// doc (cities, places, excursions, blogs). Backs the "Pick from gallery"
// modal in every admin ImageInput so authors can reuse images across
// content without pasting URLs by hand or maintaining a separate DAM.
//
// No new upload pipeline: this is a derived view over what's already
// been used. Adding a new image = still pasting a URL (or using the
// existing file-upload SingleImageInput); once saved anywhere, it
// appears in the gallery.

export type ImageGallerySource =
    | 'city'
    | 'place'
    | 'excursion'
    | 'blog'
    // Uploaded via the Media page but not yet attached to any content
    // doc. Merged into the picker client-side from the GCS bucket list
    // so freshly-uploaded assets are reusable immediately.
    | 'library'

export type ImageGalleryEntry = {
    url: string
    // First source this URL was seen on. Renderer shows this as a small
    // badge so the author can spot "oh that's from the Zagreb city page".
    source: ImageGallerySource
    // Human-readable identifier for the source (usually the doc's slug or
    // title). Shown next to the source badge.
    sourceLabel: string
}

export type AdminImageGalleryResponse = {
    entries: ImageGalleryEntry[]
}
