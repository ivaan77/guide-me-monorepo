import { UploadResponse } from '@/app/api/upload/route';
import {
    AllCityResponse,
    CityByIdResponse,
    CreateTourGuideRequest,
    CreateTourSpotRequest,
    SaveCityRequest,
    TourGuideResponse,
    TourSpotResponse
} from '@guide-me-app/core';
import axios, { AxiosResponse } from 'axios';

const restClient = axios.create({ baseURL: '/api' });

export const getAllCities = async ():Promise<AxiosResponse<AllCityResponse>> => {
    return await restClient.get('/city');
};

export const saveCity = async (request: SaveCityRequest): Promise<AxiosResponse<CityByIdResponse>> => {
    return await restClient.post('/city', request);
};

export const uploadFile = async (file: File, folder?: string): Promise<AxiosResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.set('file', file);

    if (folder) {
        formData.set('folder', folder);
    }

    return await restClient.post('/upload', formData);
};

export const saveTourSpot = async (request: CreateTourSpotRequest): Promise<AxiosResponse<TourSpotResponse>> => {
    return await restClient.post('/tour/spot', request);
};

export const getAllTourGuides = async ():Promise<AxiosResponse<TourGuideResponse[]>> => {
    return await restClient.get('/tour');
}

export const saveTourGuide = async (request: CreateTourGuideRequest):Promise<AxiosResponse<TourGuideResponse>> => {
    return await restClient.post('/tour', request);
};

export const getTourGuide = async (tourId: string):Promise<AxiosResponse<TourGuideResponse>> => {
    return await restClient.get(`/tour/${tourId}`);
}
