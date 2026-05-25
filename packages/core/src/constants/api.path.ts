export const AdminPath = {
    Discover: {
        cities: '/admin/discover/cities',
        cityBySlug: '/admin/discover/cities/:slug',
        excursions: '/admin/discover/excursions',
        excursionBySlug: '/admin/discover/excursions/:slug',
        places: '/admin/discover/places',
        placeBySlug: '/admin/discover/places/:slug',
        getCity: (slug: string): string => `/admin/discover/cities/${slug}`,
        getExcursion: (slug: string): string => `/admin/discover/excursions/${slug}`,
        getPlace: (slug: string): string => `/admin/discover/places/${slug}`,
    },
}

export const MePath = {
    me: '/me',
    favorites: '/me/favorites',
    favoriteByRef: '/me/favorites/:type/:id',
    deleteFavorite: (type: string, id: string): string =>
        `/me/favorites/${type}/${id}`,
}

export const PublicPath = {
    Directions: {
        walk: '/public/directions/walk',
    },
    Discover: {
        cities: '/public/discover/cities',
        cityById: '/public/discover/cities/:id',
        excursionById: '/public/discover/excursions/:id',
        placeById: '/public/discover/places/:id',
        getCityById: (id: string): string => `/public/discover/cities/${id}`,
        getExcursionById: (id: string): string => `/public/discover/excursions/${id}`,
        getPlaceById: (id: string): string => `/public/discover/places/${id}`,
    },
}
