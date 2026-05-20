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
}

export type AdminPoi = {
    slug: string
    order: number
    name: LocalizedString
    category: PoiCategory
    description: LocalizedString
    coords: PublicLatLng
    image: string
    images?: string[]
}

export type AdminExcursion = {
    slug: string
    citySlug: string
    name: LocalizedString
    meta: LocalizedString
    image: string
    stops: AdminExcursionStop[]
    pois?: AdminPoi[]
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
    pois?: AdminPoi[]
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
