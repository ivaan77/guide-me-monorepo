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
        deleteTourById: (id: string) => string;
        getTourById: (id: string) => string;
    };
    TourSpot: {
        save: string;
        getAll: string;
        delete: string;
        deleteSpotById: (id: string) => string;
    };
};
