import { UploadResponse } from '@/app/api/upload/route'
import {
    AllCityResponse,
    CityByIdResponse,
    CreateTourGuideRequest,
    CreateTourSpotRequest,
    EditTourGuideRequest,
    EditTourSpotRequest,
    SaveCityRequest,
    TourGuideResponse,
    TourSpotResponse,
} from '@guide-me-app/core'
import axios, { AxiosResponse } from 'axios'

const restClient = axios.create({ baseURL: '/api' })

export const getAllCities = async (): Promise<AxiosResponse<AllCityResponse>> => {
    return await restClient.get('/city')
}

export const saveCity = async (
    request: SaveCityRequest,
): Promise<AxiosResponse<CityByIdResponse>> => {
    return await restClient.post('/city', request)
}

export const uploadFile = async (
    file: File,
    folder?: string,
): Promise<AxiosResponse<UploadResponse>> => {
    const formData = new FormData()
    formData.set('file', file)

    if (folder) {
        formData.set('folder', folder)
    }

    return await restClient.post('/upload', formData)
}

export const saveTourSpot = async (
    request: CreateTourSpotRequest,
): Promise<AxiosResponse<TourSpotResponse>> => {
    return await restClient.post('/tour/spot', request)
}

export const editTourSpot = async (
    request: EditTourSpotRequest,
): Promise<AxiosResponse<TourSpotResponse>> => {
    return await restClient.put(`/tour/spot/${request.id}`, request)
}

export const deleteTourSpot = async (id: string): Promise<AxiosResponse<void>> => {
    return await restClient.delete(`/tour/spot/${id}`)
}

export const getAllTourGuides = async (): Promise<AxiosResponse<TourGuideResponse[]>> => {
    return await restClient.get('/tour')
}

export const saveTourGuide = async (
    request: CreateTourGuideRequest,
): Promise<AxiosResponse<TourGuideResponse>> => {
    return await restClient.post('/tour', request)
}

export const getTourGuide = async (tourId: string): Promise<AxiosResponse<TourGuideResponse>> => {
    return await restClient.get(`/tour/${tourId}`)
}

export const editTourGuide = async (
    tourId: string,
    request: EditTourGuideRequest,
): Promise<AxiosResponse<TourGuideResponse>> => {
    return await restClient.put(`/tour/${tourId}`, request)
}
