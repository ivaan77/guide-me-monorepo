// Authenticated-user endpoints. All require a valid Clerk session JWT in
// `Authorization: Bearer <token>` — the api guard verifies it and upserts a
// matching User record on first authed request.

export type FavoriteType = 'city' | 'excursion' | 'place'

export type FavoriteRef = {
    type: FavoriteType
    id: string // slug
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
