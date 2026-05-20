export declare const AdminPath: {
    City: {
        getAll: string;
        save: string;
        delete: string;
        byId: string;
        getCityById: (id: string) => string;
        deleteCityById: (id: string) => string;
    };
    Tour: {
        byId: string;
        getAll: string;
        save: string;
        delete: string;
        edit: string;
        deleteTourById: (id: string) => string;
        getTourById: (id: string) => string;
        editTourById: (id: string) => string;
    };
    TourSpot: {
        save: string;
        getAll: string;
        delete: string;
        edit: string;
        deleteSpotById: (id: string) => string;
        editSpotById: (id: string) => string;
    };
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
export declare const PublicPath: {
    City: {
        getAll: string;
    };
    Tour: {
        getToursInCity: string;
        getTour: string;
    };
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
