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
    rating?: PublicRatingAggregate
}

// Aggregate rating info surfaced on public list + detail responses. Omitted
// (undefined) when no ratings exist yet — mobile hides the badge in that case.
// avg is rounded to 1 decimal by the server so clients don't have to.
export type PublicRatingAggregate = {
    avg: number
    count: number
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
    rating?: PublicRatingAggregate
    // Optional lat/lng of the underlying place. Feeds the "distance from
    // me" client-side sort on CityDetailScreen. Excursion category items
    // never populate this (an excursion is a route, not a point); place
    // category items populate it whenever the source doc has coords.
    coords?: PublicLatLng
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

// How exposed to the weather this excursion is. Drives the "check the
// forecast before you go" recommendation on the mobile preview:
//   outdoor — walking outside for most of the route (parks, viewpoints,
//             open squares). Bad weather = strong "wait for a drier day".
//   mixed   — some indoor stops (museums, cafes) but user still walks
//             outside between them. Bad weather = "bring an umbrella"
//             not "skip it".
//   indoor  — mostly inside (a museum tour, a covered market). Weather
//             warning is suppressed entirely.
export const WEATHER_SENSITIVITIES = ['outdoor', 'mixed', 'indoor'] as const
export type WeatherSensitivity = (typeof WEATHER_SENSITIVITIES)[number]

export type PublicExcursion = {
    id: string
    name: string
    meta: string
    image: string
    stops: PublicExcursionStop[]
    pois?: PublicPoi[]
    interestingFacts?: PublicInterestingFact[]
    outro?: PublicExcursionOutro
    rating?: PublicRatingAggregate
    // Weather exposure — REQUIRED. Existing docs backfilled to 'outdoor'
    // by scripts/backfill-weather-sensitivity.ts (see comment in the
    // schema). All new authoring must pick a value.
    weatherSensitivity: WeatherSensitivity
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
    rating?: PublicRatingAggregate
}

export type PublicPlaceResponse = {
    place: PublicPlaceDetail
    locale: Locale
}

// --- Public web (marketing site) ---

// Aggregate counts + audio duration for the public web landing/stats band.
// Server caches this response (1h TTL) so numbers can lag slightly; every
// count is over enabled records only. `placesByCategory` covers every value
// in PoiCategory (missing categories emit 0) so the UI can render a stable
// shape without runtime guards.
export type PublicStats = {
    cities: number
    excursions: number
    excursionStops: number
    places: number
    placesByCategory: Record<PoiCategory, number>
    // Total narration duration across all interesting facts, in milliseconds.
    // Facts without a populated `audioDurationMs` contribute 0 — the number
    // is a lower bound until every fact is backfilled.
    audioDurationMs: number
}

export type PublicStatsResponse = {
    stats: PublicStats
}

// One item in the admin-curated web gallery. Sourced from either a City or a
// Place (`sourceType` disambiguates). `id` is the source doc's slug; taken
// together with `sourceType` it forms a stable, unique key. `link` is an
// optional deep-link back into the mobile app (or a public web route) — the
// web renders a click affordance only when present.
export type PublicGalleryItem = {
    id: string
    sourceType: 'city' | 'place'
    title: string
    subtitle?: string
    image: string
    link?: string
}

export type PublicGalleryResponse = {
    items: PublicGalleryItem[]
}

// Usage counters derived from PostHog events. Distinct from PublicStats
// (which counts *content produced* in Mongo): these describe *engagement*
// — how many humans used the app and what they did. All values are
// cumulative all-time. Returns zeros when PostHog is unreachable so the
// landing degrades gracefully to hiding the band.
//
// `users` — count of distinct sign-ups. Anonymous device sessions that
// never signed up are NOT counted here (see the `user_signup` event fired
// on Clerk account creation).
// `audioListenedHours` — sum of `duration_ms` across every `audio_played`
// event, converted to hours, rounded to the nearest integer.
// `routesCompleted` — count of `excursion_completed` events (once per
// excursion arrival, guarded against double-fires in the mobile app).
// `countriesReached` — count of distinct $geoip_country_code across every
// event PostHog has ever ingested. Auto-attached by the SDK.
// `averageRating` — mean rating across all cities/excursions/places, rounded
// to 1 decimal. Sourced from Mongo (ratings collection, authoritative)
// rather than PostHog so users who rated pre-analytics still count.
// `ratingsCount` — total rating rows in Mongo. Included so the average
// isn't shown alone (a "4.5 average" from 2 ratings is misleading).
export type PublicUsageStats = {
    users: number
    audioListenedHours: number
    routesCompleted: number
    countriesReached: number
    averageRating: number
    ratingsCount: number
    // Count of `weather_checked` events. Fires once per (excursionId,
    // date, result-classification) so it approximates "how often did a
    // user consult the forecast before deciding to go?" Useful for
    // gauging whether the feature is used, and eventually for
    // correlating with excursion_started.
    weatherChecks: number
}

export type PublicUsageStatsResponse = {
    stats: PublicUsageStats
}

// Popularity-ranked gallery items — a data-driven complement to the
// admin-curated PublicGalleryItem. Same shape as the curated one for easy
// rendering, plus a `popularity` field so the UI can label how "hot" each
// item is (e.g. "1.2k walkers"). Sourced from PostHog event counts and
// projected back onto the discover Mongo docs so titles/images still come
// from the source of truth.
//
// Populated best-effort — when PostHog is unreachable or has no events,
// the endpoint returns an empty items array (never throws). Cached 1h.
export type PublicPopularItem = {
    id: string
    sourceType: 'city' | 'excursion' | 'place'
    title: string
    subtitle?: string
    image: string
    // How the popularity was measured — different for each sourceType so
    // the label on the web reads sensibly ("walkers" for excursions,
    // "explorers" for cities, "saves" for places).
    popularity: number
    popularityKind: 'walkers' | 'explorers' | 'saves'
}

export type PublicPopularGalleryResponse = {
    items: PublicPopularItem[]
}

// Weather summary for one lat/lng at one date, backed by Open-Meteo via
// the API's WeatherService. Values are the daily aggregates for the
// requested date in the location's local timezone.
//
// Never trust `weatherCode` alone for logic — different providers use
// different code sets. Use `precipitationMm` / `windKmh` / `tempMaxC` as
// the primary signals; `weatherCode` is fine for icon selection but not
// go/no-go decisions.
export type PublicWeather = {
    // ISO yyyy-mm-dd date this forecast applies to, in the location's
    // local timezone (Open-Meteo does the conversion for us).
    date: string
    // Latitude/longitude the forecast was resolved for. Open-Meteo may
    // snap to the nearest grid point (~1km); returned so the client can
    // detect drift if needed.
    resolvedLat: number
    resolvedLng: number
    // Daily max/min temperature in Celsius.
    tempMaxC: number
    tempMinC: number
    // Total precipitation in millimeters over the day. > 2mm is "bring
    // an umbrella"; > 10mm is "the trail will be muddy."
    precipitationMm: number
    // Max sustained wind in km/h. > 40 is "windy / bring layers"; > 60
    // is "strongly consider postponing" for outdoor routes.
    windKmh: number
    // WMO weather code (0=clear, 1-3=partly cloudy, 45-48=fog, 51-67=rain,
    // 71-77=snow, 80-82=showers, 85-86=snow showers, 95-99=thunder). Fine
    // for picking an icon. Full mapping:
    // https://open-meteo.com/en/docs#weathervariables
    weatherCode: number
}

export type PublicWeatherResponse = {
    weather: PublicWeather
}
