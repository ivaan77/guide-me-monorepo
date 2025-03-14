import { TourGuidePlace } from '@/types'

export const INITIAL_TOUR_GUIDE_PLACE: TourGuidePlace = {
    id: undefined,
    city: undefined,
    name: '',
    tourSpots: [],
    directions: [],
    introAudio: null,
    outroAudio: null,
}

export const EDITED_SUFFIX = `edited/${new Date().toISOString()}`
