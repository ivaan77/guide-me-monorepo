import { Nullable } from "../../common";
export type SaveCityRequest = {
    name: string;
    location: Coordinates;
    infoAudio: Nullable<string>;
};
export type City = {
    id: string;
    name: string;
    location: Coordinates;
    infoAudio: Nullable<string>;
};
export type AllCityResponse = {
    cities: City[];
};
export type CityByIdResponse = {
    city: City;
};
export type CreateTourSpotRequest = {
    name: string;
    images: string[];
    audio: string;
    infoAudio: Nullable<string>;
    location: Coordinates;
};
export type TourSpotResponse = {
    id: string;
    name: string;
    images: string[];
    audio: string;
    infoAudio: Nullable<string>;
    location: Coordinates;
};
export type CreateTourGuideRequest = {
    name: string;
    city: string;
    directions: Coordinates[];
    tourSpots: string[];
};
export type TourGuideResponse = {
    id: string;
    name: string;
    city: City;
    directions: Coordinates[];
    tourSpots: TourSpotResponse[];
};
export type Coordinates = {
    latitude: number;
    longitude: number;
};
