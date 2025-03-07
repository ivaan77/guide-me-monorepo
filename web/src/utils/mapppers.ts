import { MarkerInfo } from '@/components/Map/Marker'
import { Coordinates, Nullable, TourGuideResponse, TourSpotResponse } from '@guide-me-app/core'
import { TourGuidePlace, TourGuideStop } from '@/types'
import { INITIAL_TOUR_GUIDE_PLACE } from '@/constants/tour';

type MarkerInfoOptions = {
    id?: string
    title?: string
}

export class CoordinateMapper {
    public static fromCoordinatesToMarkerInfos(coordinates: Coordinates[]): MarkerInfo[] {
        return coordinates.map((coordinate) =>
            CoordinateMapper.fromCoordinateToMarkerInfo(coordinate),
        )
    }

    public static fromGoogleToMarkerInfos(latLng: google.maps.LatLngLiteral[]): MarkerInfo[] {
        return latLng.map((coordinate) => CoordinateMapper.fromGoogleToMarkerInfo(coordinate))
    }

    public static fromGoogleToMarkerInfo(
        latLng: google.maps.LatLngLiteral,
        options?: MarkerInfoOptions,
    ): MarkerInfo {
        return {
            id: options?.id,
            title: options?.title,
            location: latLng,
        }
    }

    public static fromCoordinateToMarkerInfo(
        coordinate: Coordinates,
        options?: MarkerInfoOptions,
    ): MarkerInfo {
        return {
            id: options?.id,
            title: options?.title,
            location: CoordinateMapper.fromCoordinateToGoogle(coordinate),
        }
    }

    public static fromCoordinatesToGoogle(coordinates: Coordinates[]): google.maps.LatLngLiteral[] {
        return coordinates.map(CoordinateMapper.fromCoordinateToGoogle)
    }

    public static fromCoordinateToGoogle(coordinate: Coordinates): google.maps.LatLngLiteral {
        return {
            lat: coordinate.latitude,
            lng: coordinate.longitude,
        }
    }

    public static fromGoogleToCoordinates(latLng: google.maps.LatLngLiteral[]): Coordinates[] {
        return latLng.map(CoordinateMapper.fromGoogleToCoordinate)
    }

    public static fromGoogleToCoordinate(latLng: google.maps.LatLngLiteral): Coordinates {
        return {
            longitude: latLng.lng,
            latitude: latLng.lat,
        }
    }
}

export class TourMapper {
    public static fromTourGuideResponseToTourPlace(
        response: Nullable<TourGuideResponse>,
    ): TourGuidePlace {
        if (!response) {
            return INITIAL_TOUR_GUIDE_PLACE
        }

        return {
            id: response.id,
            cityId: response.city.id,
            name: response.name,
            introAudio: response.introAudio,
            outroAudio: response.outroAudio,
            directions: response.directions,
            tourSpots: this.fromTourSpotResponseTourStops(response.tourSpots),
        }
    }

    private static fromTourSpotResponseTourStops(response: TourSpotResponse[]): TourGuideStop[] {
        return response.map((response) => {
            return {
                id: response.id,
                name: response.name,
                introAudio: response.introAudio,
                outroAudio: response.outroAudio,
                audio: response.audio,
                images: response.images,
                coordinate: CoordinateMapper.fromCoordinateToGoogle(response.location),
            }
        })
    }
}
