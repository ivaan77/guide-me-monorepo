import { Coordinates } from '../admin';
export type WalkingDirectionsRequest = {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
};
export type WalkingDirectionsResponse = {
    polyline: Coordinates[];
    distanceMeters: number;
    durationSeconds: number;
    cached: boolean;
};
export declare const SUPPORTED_LOCALES: readonly ["en", "de", "hr"];
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
export type LocalizedString = {
    en: string;
} & Partial<Record<Locale, string>>;
export type PublicEditorPick = {
    headline: string;
    tagline: string;
};
export type PublicCity = {
    id: string;
    name: string;
    country: string;
    image: string;
    editorPick?: PublicEditorPick;
};
export type AllPublicCitiesResponse = {
    cities: PublicCity[];
    locale: Locale;
};
export type PublicCategoryItem = {
    id: string;
    name: string;
    meta: string;
    image: string;
    description?: string;
    images?: string[];
};
export type PublicCityDetail = PublicCity & {
    excursions?: PublicCategoryItem[];
    restaurants?: PublicCategoryItem[];
    bars?: PublicCategoryItem[];
    shopping?: PublicCategoryItem[];
};
export type PublicCityDetailResponse = {
    city: PublicCityDetail;
    locale: Locale;
};
export type PublicLatLng = {
    latitude: number;
    longitude: number;
};
export type PublicExcursionStop = {
    id: string;
    order: number;
    name: string;
    description: string;
    coords: PublicLatLng;
    image: string;
    images?: string[];
    audioUrl?: string;
};
export type PoiCategory = 'restaurant' | 'bar' | 'shopping';
export type PublicPoi = {
    id: string;
    order: number;
    name: string;
    category: PoiCategory;
    description: string;
    coords: PublicLatLng;
    image: string;
    images?: string[];
};
export type PublicExcursion = {
    id: string;
    name: string;
    meta: string;
    image: string;
    stops: PublicExcursionStop[];
    pois?: PublicPoi[];
};
export type PublicExcursionResponse = {
    excursion: PublicExcursion;
    locale: Locale;
};
export type PublicPlaceDetail = {
    id: string;
    name: string;
    meta: string;
    category: PoiCategory;
    image: string;
    description?: string;
    images?: string[];
};
export type PublicPlaceResponse = {
    place: PublicPlaceDetail;
    locale: Locale;
};
