export declare const AdminPath: {
    Discover: {
        cities: string;
        cityBySlug: string;
        excursions: string;
        excursionBySlug: string;
        places: string;
        placeBySlug: string;
        getCity: (slug: string) => string;
        getExcursion: (slug: string) => string;
        getPlace: (slug: string) => string;
    };
};
export declare const MePath: {
    me: string;
    favorites: string;
    favoriteByRef: string;
    deleteFavorite: (type: string, id: string) => string;
};
export declare const PublicPath: {
    Directions: {
        walk: string;
    };
    Discover: {
        cities: string;
        cityById: string;
        excursionById: string;
        placeById: string;
        getCityById: (id: string) => string;
        getExcursionById: (id: string) => string;
        getPlaceById: (id: string) => string;
    };
};
