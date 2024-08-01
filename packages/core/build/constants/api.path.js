"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPath = void 0;
exports.AdminPath = {
    City: {
        getAll: '/city/all',
        save: '/city/save',
        delete: '/city/delete/:id',
        byId: '/city/:id',
        getCityById: (id) => exports.AdminPath.City.byId.replace(':id', id),
        deleteCityById: (id) => exports.AdminPath.City.delete.replace(':id', id),
    },
    Tour: {
        byId: '/tour/:id',
        getAll: '/tour/all',
        save: '/tour/save',
        delete: '/tour/delete/:id',
        deleteTourById: (id) => exports.AdminPath.Tour.delete.replace(':id', id),
        getTourById: (id) => exports.AdminPath.Tour.byId.replace(':id', id),
    },
    TourSpot: {
        save: '/tour/spot/save',
        getAll: '/tour/spot/all',
        delete: '/tour/spot/delete/:id',
        deleteSpotById: (id) => exports.AdminPath.TourSpot.delete.replace(':id', id),
    }
};
