"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicPath = exports.AdminPath = void 0;
exports.AdminPath = {
    Discover: {
        cities: '/admin/discover/cities',
        cityBySlug: '/admin/discover/cities/:slug',
        excursions: '/admin/discover/excursions',
        excursionBySlug: '/admin/discover/excursions/:slug',
        places: '/admin/discover/places',
        placeBySlug: '/admin/discover/places/:slug',
        getCity: (slug) => `/admin/discover/cities/${slug}`,
        getExcursion: (slug) => `/admin/discover/excursions/${slug}`,
        getPlace: (slug) => `/admin/discover/places/${slug}`,
    },
};
exports.PublicPath = {
    Directions: {
        walk: '/public/directions/walk',
    },
    Discover: {
        cities: '/public/discover/cities',
        cityById: '/public/discover/cities/:id',
        excursionById: '/public/discover/excursions/:id',
        placeById: '/public/discover/places/:id',
        getCityById: (id) => `/public/discover/cities/${id}`,
        getExcursionById: (id) => `/public/discover/excursions/${id}`,
        getPlaceById: (id) => `/public/discover/places/${id}`,
    },
};
