import { Nullable } from "../../common";
export type WithExtendedAudio = {
    introAudio: Nullable<string>;
    outroAudio: Nullable<string>;
};
export type SaveCityRequest = WithExtendedAudio & {
    name: string;
    location: Coordinates;
};
export type City = WithExtendedAudio & {
    id: string;
    name: string;
    location: Coordinates;
};
export type AllCityResponse = {
    cities: City[];
};
export type CityByIdResponse = {
    city: City;
};
export type CreateTourSpotRequest = WithExtendedAudio & {
    name: string;
    images: string[];
    audio: string;
    location: Coordinates;
};
export type TourSpotResponse = WithExtendedAudio & {
    id: string;
    name: string;
    images: string[];
    audio: string;
    location: Coordinates;
};
export type CreateTourGuideRequest = WithExtendedAudio & {
    name: string;
    city: string;
    directions: Coordinates[];
    tourSpots: string[];
};
export type TourGuideResponse = WithExtendedAudio & {
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
