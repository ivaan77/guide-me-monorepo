import { TourGuidePlace } from '@/app/tour/add/page'

export const INITIAL_TOUR_GUIDE_PLACE: TourGuidePlace = {
    id: undefined,
    cityId: undefined,
    name: '',
    tourSpots: [],
    directions: [],
    introAudio: null,
    outroAudio: null,
}

export const EDITED_SUFFIX = `edited/${new Date().toISOString()}`
