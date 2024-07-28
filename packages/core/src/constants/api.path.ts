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
        getAll: '/tour/all',
        save: '/tour/save'
    },
    TourSpot: {
        save: '/tour/spot/save',
        getAll: '/tour/spot/all',
    }
};