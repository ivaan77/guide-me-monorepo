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
};
