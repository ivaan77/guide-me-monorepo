export type Coordinates = {
    latitude: number
    longitude: number
}

export type WalkingDirectionsRequest = {
    originLat: number
    originLng: number
    destLat: number
    destLng: number
}

export type WalkingDirectionsResponse = {
    polyline: Coordinates[]
    distanceMeters: number
    durationSeconds: number
    cached: boolean
}

// --- Discover (public mobile feed) ---

export const SUPPORTED_LOCALES = ['en', 'de', 'hr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

// Localized fields are nested by locale in the underlying data (Mongo target
// shape). The API resolves to a single language before responding, so clients
// only ever see flat strings.
export type LocalizedString = {
    en: string
} & Partial<Record<Locale, string>>

export type PublicEditorPick = {
    headline: string
    tagline: string
}

export type PublicCity = {
    id: string // stable slug, used in routes
    name: string
    country: string
    image: string
    editorPick?: PublicEditorPick
}

export type AllPublicCitiesResponse = {
    cities: PublicCity[]
    locale: Locale // the locale used to resolve the response
}

// --- City detail ---

// subCategory is an optional free-text label (e.g. "Japanese", "Pizza",
// "Recommended"). When present, the mobile UI groups same-category items
// by this string. Entries without a subCategory fall into an "Other"
// bucket at the bottom of their category section.
export type PublicCategoryItem = {
    id: string
    name: string
    meta: string
    image: string
    description?: string
    images?: string[]
    subCategory?: string
}

// City detail now also exposes events and parks, plus an optional
// city-level audio narration.
export type PublicCityDetail = PublicCity & {
    audioUrl?: string
    excursions?: PublicCategoryItem[]
    restaurants?: PublicCategoryItem[]
    cafes?: PublicCategoryItem[]
    bars?: PublicCategoryItem[]
    shopping?: PublicCategoryItem[]
    events?: PublicCategoryItem[]
    parks?: PublicCategoryItem[]
}

export type PublicCityDetailResponse = {
    city: PublicCityDetail
    locale: Locale
}

// --- Excursion detail ---

export type PublicLatLng = {
    latitude: number
    longitude: number
}

// triggerRadius (meters) is per-stop and optional. When unset, the mobile
// app falls back to its global default arrival radius.
export type PublicExcursionStop = {
    id: string
    order: number
    name: string
    description: string
    coords: PublicLatLng
    image: string
    images?: string[]
    audioUrl?: string
    triggerRadius?: number
}

export type PoiCategory =
    | 'restaurant'
    | 'cafe'
    | 'bar'
    | 'shopping'
    | 'event'
    | 'park'

// PublicPoi is now the resolved Place reference: the api dereferences
// excursion.pois[].placeSlug into the full Place document so mobile gets
// everything in one response.
export type PublicPoi = {
    id: string
    order: number
    name: string
    category: PoiCategory
    description: string
    coords: PublicLatLng
    image: string
    images?: string[]
    subCategory?: string
}

// Interesting facts are excursion-level narration cards. Each has its own
// localized audio narration; resolved to a single string on the public side.
export type PublicInterestingFact = {
    id: string
    title: string
    audioUrl: string
}

export type PublicExcursion = {
    id: string
    name: string
    meta: string
    image: string
    stops: PublicExcursionStop[]
    pois?: PublicPoi[]
    interestingFacts?: PublicInterestingFact[]
}

export type PublicExcursionResponse = {
    excursion: PublicExcursion
    locale: Locale
}

// --- Place detail ---

// Places are the canonical reference for any city-affiliated point of
// interest. Excursions reference them by slug; cities embed a list of
// slugs to display. Coords + audioUrl + subCategory are optional.
export type PublicPlaceDetail = {
    id: string
    name: string
    meta: string
    category: PoiCategory
    image: string
    description?: string
    images?: string[]
    coords?: PublicLatLng
    audioUrl?: string
    subCategory?: string
}

export type PublicPlaceResponse = {
    place: PublicPlaceDetail
    locale: Locale
}
