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

export type MeResponse = {
    clerkUserId: string
    favorites: FavoriteRef[]
    createdAt: string
    updatedAt: string
}

export type AddFavoriteRequest = FavoriteRef

export type AddFavoriteResponse = {
    favorites: FavoriteRef[]
}

export type RemoveFavoriteResponse = AddFavoriteResponse
