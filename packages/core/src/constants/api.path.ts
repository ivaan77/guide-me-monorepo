export const AdminPath = {
    City: {
        getAll: '/city/all',
        save: '/city/save',
        delete: '/city/delete/:id',
        byId: '/city/:id',
        getCityById: (id: string): string => AdminPath.City.byId.replace(':id', id),
        deleteCityById: (id: string): string => AdminPath.City.delete.replace(':id', id),
    },
    Tour: {
        byId: '/tour/:id',
        getAll: '/tour/all',
        save: '/tour/save',
        getTourById: (id: string): string => AdminPath.Tour.byId.replace(':id', id),
    },
    TourSpot: {
        save: '/tour/spot/save',
        getAll: '/tour/spot/all',
    }
};