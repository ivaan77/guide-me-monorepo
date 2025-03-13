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
        delete: '/tour/delete/:id',
        edit: '/tour/edit/:id',
        deleteTourById: (id: string): string => AdminPath.Tour.delete.replace(':id', id),
        getTourById: (id: string): string => AdminPath.Tour.byId.replace(':id', id),
        editTourById: (id: string): string => AdminPath.Tour.edit.replace(':id', id),
    },
    TourSpot: {
        save: '/tour/spot/save',
        getAll: '/tour/spot/all',
        delete: '/tour/spot/delete/:id',
        edit: '/tour/spot/edit/:id',
        deleteSpotById: (id: string): string => AdminPath.TourSpot.delete.replace(':id', id),
        editSpotById: (id: string): string => AdminPath.TourSpot.edit.replace(':id', id),
    }
};

export const PublicPath = {
    City: {
        getAll: '/public/cities'
    },
    Tour: {
        getToursInCity:'/public/tours/:cityId',
        getTour: '/public/tour/:id',
    }
}