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
    }
};
