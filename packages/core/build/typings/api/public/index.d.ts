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
