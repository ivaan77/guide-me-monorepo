import {
    LocalizedString,
    PoiCategory,
    PublicLatLng,
    WeatherSensitivity,
} from '../public'

// Admin shape: raw localized fields (not pre-resolved), full editable surface.
// Different from PublicCity etc. which serve the mobile app with flat strings
// resolved to a single locale.

export type AdminEditorPick = {
    headline: LocalizedString
    tagline: LocalizedString
}

export type AdminCity = {
    slug: string
    image: string
    name: LocalizedString
    country: LocalizedString
    editorPick?: AdminEditorPick
    // City-level audio narration (optional, per locale).
    audioUrl?: LocalizedAudio
    // Slugs of Places this city shows in its detail screen. Order is preserved.
    cityPlaceSlugs?: string[]
    isEnabled: boolean
    // Public web gallery inclusion + ordering.
    webFeatured: boolean
    webFeaturedOrder: number
    createdAt?: string
    updatedAt?: string
}

export type AdminCreateCityRequest = {
    slug: string
    image: string
    name: LocalizedString
    country: LocalizedString
    editorPick?: AdminEditorPick
    audioUrl?: LocalizedAudio
    cityPlaceSlugs?: string[]
    isEnabled?: boolean
    webFeatured?: boolean
    webFeaturedOrder?: number
}

export type AdminUpdateCityRequest = Partial<Omit<AdminCreateCityRequest, 'slug'>>

// Audio URLs are localized: editors can upload one file per locale. All entries
// are optional — a stop may have no audio at all, or only English. The public
// mapper resolves to a single string for the requested locale at read time.
export type LocalizedAudio = Partial<Record<'en' | 'de' | 'hr', string>>

// A sub-stop sits inside a parent stop (a "bundle"). Has its own content
// and coords; inherits the parent's triggerRadius. Array position drives
// display order (no `order` field).
export type AdminSubStop = {
    slug: string
    name: LocalizedString
    description: LocalizedString
    coords: PublicLatLng
    image: string
    images?: string[]
    audioUrl?: LocalizedAudio
}

export type AdminExcursionStop = {
    slug: string
    order: number
    name: LocalizedString
    description: LocalizedString
    coords: PublicLatLng
    image: string
    images?: string[]
    audioUrl?: LocalizedAudio
    // Per-stop arrival radius (meters). Optional; mobile falls back to the
    // global default when unset.
    triggerRadius?: number
    // When non-empty this stop becomes a "bundle" — see PublicExcursionStop
    // comment for the mobile rendering rules.
    subStops?: AdminSubStop[]
}

// Optional sign-off shown after the last stop. See PublicExcursionOutro
// for the mobile-side rendering contract.
export type AdminExcursionOutro = {
    title: LocalizedString
    description: LocalizedString
    image: string
    images?: string[]
    audioUrl?: LocalizedAudio
}

// Excursions reference Places by slug rather than embedding their own POI
// records. Order is per-excursion so the same place can sit in different
// positions in different excursions.
export type AdminExcursionPoiRef = {
    placeSlug: string
    order: number
}

export type AdminInterestingFact = {
    slug: string
    title: LocalizedString
    audioUrl: LocalizedAudio
    coords?: PublicLatLng
    triggerRadius?: number
}

export type AdminExcursion = {
    slug: string
    citySlug: string
    name: LocalizedString
    meta: LocalizedString
    image: string
    stops: AdminExcursionStop[]
    pois?: AdminExcursionPoiRef[]
    interestingFacts?: AdminInterestingFact[]
    outro?: AdminExcursionOutro
    isEnabled: boolean
    // See WeatherSensitivity in public types for semantics. Required —
    // existing docs backfilled to 'outdoor' via the migration script.
    weatherSensitivity: WeatherSensitivity
    createdAt?: string
    updatedAt?: string
}

export type AdminCreateExcursionRequest = {
    slug: string
    citySlug: string
    name: LocalizedString
    meta: LocalizedString
    image: string
    stops?: AdminExcursionStop[]
    pois?: AdminExcursionPoiRef[]
    interestingFacts?: AdminInterestingFact[]
    outro?: AdminExcursionOutro
    isEnabled?: boolean
    // Required for new excursions. If a caller omits it, the API rejects.
    weatherSensitivity: WeatherSensitivity
}

export type AdminUpdateExcursionRequest = Partial<
    Omit<AdminCreateExcursionRequest, 'slug'>
>

export type AdminPlace = {
    slug: string
    citySlug: string
    category: PoiCategory
    name: LocalizedString
    meta: LocalizedString
    image: string
    description?: LocalizedString
    images?: string[]
    // Geographic location. Optional only because legacy non-excursion places
    // were never authored with coords; new entries should always set this.
    coords?: PublicLatLng
    // Free-text optional sub-category label (e.g. "Japanese", "Pizza").
    // Localized so editors can vary the label by locale.
    subCategory?: LocalizedString
    // Optional audio narration, per locale.
    audioUrl?: LocalizedAudio
    isEnabled: boolean
    // Public web gallery inclusion + ordering.
    webFeatured: boolean
    webFeaturedOrder: number
    createdAt?: string
    updatedAt?: string
}

export type AdminCreatePlaceRequest = {
    slug: string
    citySlug: string
    category: PoiCategory
    name: LocalizedString
    meta: LocalizedString
    image: string
    description?: LocalizedString
    images?: string[]
    coords?: PublicLatLng
    subCategory?: LocalizedString
    audioUrl?: LocalizedAudio
    isEnabled?: boolean
    webFeatured?: boolean
    webFeaturedOrder?: number
}

export type AdminUpdatePlaceRequest = Partial<
    Omit<AdminCreatePlaceRequest, 'slug'>
>

// Response wrappers (mirror the public response style)
export type AdminAllCitiesResponse = { cities: AdminCity[] }
export type AdminCityResponse = { city: AdminCity }
export type AdminAllExcursionsResponse = { excursions: AdminExcursion[] }
export type AdminExcursionResponse = { excursion: AdminExcursion }
export type AdminAllPlacesResponse = { places: AdminPlace[] }
export type AdminPlaceResponse = { place: AdminPlace }

// --- Stats ---

// Lightweight reference for inactive-entity lists on the stats page.
// Only the bare minimum to identify and link to the record.
export type AdminInactiveRef = {
    slug: string
    name: string
    citySlug?: string
}

// One cumulative-by-date sample point. `date` is an ISO yyyy-mm-dd string
// (UTC). The api emits one point per day on which any new doc was created,
// containing running cumulative totals.
//
// `images` and `audioDurationMs` are attached to the day a doc was created,
// even though images can be added later via update — a fully accurate
// "produced per day" view would require per-image createdAt on every asset
// URL, which we don't store. Good enough for a marketing chart.
export type AdminStatsTimeseriesPoint = {
    date: string
    cities: number
    excursions: number
    places: number
    // Cumulative image count across all cities + excursions + places up to
    // this date. Counts every URL in every images[] array plus the top-level
    // `image` on each doc + stop + sub-stop + outro.
    images: number
    // Cumulative sum of every populated per-locale audio duration in ms,
    // across every audio-bearing surface, up to this date.
    audioDurationMs: number
}

export type AdminStats = {
    counts: {
        cities: number
        excursions: number
        places: number
        // Per-category place breakdown. Categories with zero docs are still
        // present (value 0) so the UI can render a stable shape.
        placesByCategory: Record<PoiCategory, number>
        // Total stops across all excursions.
        excursionStops: number
        // Total interesting facts across all excursions.
        interestingFacts: number
        // Total POI references (sum of excursion.pois lengths).
        poiReferences: number
    }
    inactive: {
        cities: AdminInactiveRef[]
        excursions: AdminInactiveRef[]
        places: AdminInactiveRef[]
    }
    // Sorted ascending by date. May be empty if no docs have createdAt.
    timeseries: AdminStatsTimeseriesPoint[]
}

export type AdminStatsResponse = { stats: AdminStats }

// How many cities and excursions currently reference a place. Used by the
// admin place edit form to surface a warning when a place isn't linked to
// anything — meaning users can't see it.
export type AdminPlaceReferencesResponse = {
    cities: number
    excursions: number
}

// --- Admin web content (public web gallery + stats surfaces) ---

// One row in the admin gallery curator UI. Sourced from either the cities or
// places collection. Order + featured flag are editable; other fields are
// read-only projections from the source doc so admins can eyeball what the
// public site will render.
export type AdminGalleryItem = {
    slug: string
    sourceType: 'city' | 'place'
    title: string
    subtitle?: string
    image: string
    webFeatured: boolean
    webFeaturedOrder: number
}

export type AdminGalleryResponse = {
    items: AdminGalleryItem[]
}

// Bulk-update payload. Every entry sets the doc's `webFeatured` + `webFeaturedOrder`
// in one atomic pass. Sending an empty array is a no-op. Items whose slug isn't
// found are ignored (silently) — admin UI should keep local state in sync
// with what the server just returned.
export type AdminGalleryUpdateEntry = {
    slug: string
    sourceType: 'city' | 'place'
    webFeatured: boolean
    webFeaturedOrder: number
}

export type AdminGalleryUpdateRequest = {
    items: AdminGalleryUpdateEntry[]
}
