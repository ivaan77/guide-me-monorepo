import { City, Coordinates, Nullable } from '@guide-me-app/core'

export type TourGuidePlace = {
    id: string | undefined
    city: City | undefined
    name: string
    tourSpots: TourGuideStop[]
    directions: Coordinates[]
    introAudio: Nullable<string>
    outroAudio: Nullable<string>
}

export type TourGuideStop = {
    id: Nullable<string>
    name: string
    coordinate: Nullable<google.maps.LatLngLiteral>
    introAudio: Nullable<string>
    outroAudio: Nullable<string>
    audio: string
    images: string[]
}
