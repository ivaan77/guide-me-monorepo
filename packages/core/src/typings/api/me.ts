// Authenticated-user endpoints. All require a valid Clerk session JWT in
// `Authorization: Bearer <token>` — the api guard verifies it and upserts a
// matching User record on first authed request.

export type FavoriteType = 'city' | 'excursion' | 'place' | 'sub-stop'

// For 'city' | 'excursion' | 'place' the id is the entity's slug.
// For 'sub-stop' the id is a composite slug
//   `${excursionSlug}:${stopSlug}:${subStopSlug}`
// so the server can walk from the excursion → stop → sub-stop when
// hydrating / validating the reference.
export type FavoriteRef = {
    type: FavoriteType
    id: string
}

// Only top-level entities can be rated. Sub-stops share the excursion rating.
export type RatingTargetType = 'city' | 'excursion' | 'place'

export type RatingValue = 1 | 2 | 3 | 4 | 5

// The user's own rating for one entity — returned in /me so mobile can
// pre-select the user's stars on the detail screen. `targetId` is the
// entity's slug (same convention as favorites).
export type UserRatingRef = {
    targetType: RatingTargetType
    targetId: string
    value: RatingValue
}

// Aggregate view of everyone's ratings for an entity — shown publicly on
// list cards and detail screens. When count is 0, avg is null.
export type RatingAggregate = {
    avg: number | null
    count: number
}

export type MeResponse = {
    clerkUserId: string
    favorites: FavoriteRef[]
    ratings: UserRatingRef[]
    createdAt: string
    updatedAt: string
}

export type AddFavoriteRequest = FavoriteRef

export type AddFavoriteResponse = {
    favorites: FavoriteRef[]
}

export type RemoveFavoriteResponse = AddFavoriteResponse

// --- Ratings ---

export type RateRequest = {
    targetType: RatingTargetType
    targetId: string
    value: RatingValue
}

// After a write, mobile needs (a) the user's new rating and (b) the new
// public aggregate so it can update both the star picker and the "★ 4.3"
// badge in the same render.
export type RateResponse = {
    rating: UserRatingRef
    aggregate: RatingAggregate
}

export type RemoveRatingResponse = {
    aggregate: RatingAggregate
}
