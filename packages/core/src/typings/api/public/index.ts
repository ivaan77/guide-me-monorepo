import { Coordinates } from '../admin'

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
