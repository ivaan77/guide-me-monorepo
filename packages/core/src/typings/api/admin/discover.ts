import {
    LocalizedString,
    PoiCategory,
    PublicLatLng,
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
}

export type AdminUpdateCityRequest = Partial<Omit<AdminCreateCityRequest, 'slug'>>

// Audio URLs are localized: editors can upload one file per locale. All entries
// are optional — a stop may have no audio at all, or only English. The public
// mapper resolves to a single string for the requested locale at read time.
export type LocalizedAudio = Partial<Record<'en' | 'de' | 'hr', string>>

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
    isEnabled: boolean
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
    isEnabled?: boolean
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
