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

// City detail exposes each POI category as its own optional list so the
// mobile app can render a section per category in any order it wants.
// Optional city-level audio narration is also surfaced here.
export type PublicCityDetail = PublicCity & {
    audioUrl?: string
    excursions?: PublicCategoryItem[]
    restaurants?: PublicCategoryItem[]
    cafes?: PublicCategoryItem[]
    pastries?: PublicCategoryItem[]
    brunches?: PublicCategoryItem[]
    bars?: PublicCategoryItem[]
    shopping?: PublicCategoryItem[]
    events?: PublicCategoryItem[]
    parks?: PublicCategoryItem[]
    museums?: PublicCategoryItem[]
    viewpoints?: PublicCategoryItem[]
    locals?: PublicCategoryItem[]
    workshops?: PublicCategoryItem[]
    playareas?: PublicCategoryItem[]
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

// A sub-stop is one item inside a "bundle" stop. Carries its own content
// (image, description, audio, coords). Each sub-stop gets a real pin on
// the map at its own coords.
export type PublicSubStop = {
    id: string
    name: string
    description: string
    coords: PublicLatLng
    image: string
    images?: string[]
    audioUrl?: string
}

// triggerRadius (meters) is per-stop and optional. When unset, the mobile
// app falls back to its global default arrival radius.
// When `subStops` is non-empty this stop becomes a "bundle": mobile shows
// a numbered pin, ignores the stop's own audioUrl, and sequences the user
// through each sub-stop's content on arrival.
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
    subStops?: PublicSubStop[]
}

export type PoiCategory =
    | 'restaurant'
    | 'cafe'
    | 'pastry'
    | 'brunch'
    | 'bar'
    | 'shopping'
    | 'event'
    | 'park'
    | 'museum'
    | 'viewpoint'
    | 'local'
    | 'workshop'
    | 'playarea'

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
// When `coords` is set, the mobile app fires the fact as soon as the user
// is within `triggerRadius` meters of those coords (overriding the default
// "distance into the leg" heuristic). Facts without coords use the heuristic.
export type PublicInterestingFact = {
    id: string
    title: string
    audioUrl: string
    coords?: PublicLatLng
    triggerRadius?: number
}

// Optional sign-off shown after the user finishes (or skips) the last
// stop. Authored in admin; resolves localized strings + audio.
export type PublicExcursionOutro = {
    title: string
    description: string
    image: string
    images?: string[]
    audioUrl?: string
}

export type PublicExcursion = {
    id: string
    name: string
    meta: string
    image: string
    stops: PublicExcursionStop[]
    pois?: PublicPoi[]
    interestingFacts?: PublicInterestingFact[]
    outro?: PublicExcursionOutro
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
