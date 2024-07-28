import { UploadResponse } from '@/app/api/upload/route';
import { AllCityResponse, CityByIdResponse, CreateTourSpotRequest, SaveCityRequest, TourSpotResponse } from '@guide-me-app/core';
import axios, { AxiosResponse } from 'axios';

const restClient = axios.create({ baseURL: '/api' });

export const getAllCities = async ():Promise<AxiosResponse<AllCityResponse>> => {
    return await restClient.get('/city');
};

export const saveCity = async (request: SaveCityRequest): Promise<AxiosResponse<CityByIdResponse>> => {
    return await restClient.post('/city', request);
};

export const uploadFile = async (file: File): Promise<AxiosResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.set('file', file);

    return await restClient.post('/upload', formData);
};

export const saveTourSpot = async (request: CreateTourSpotRequest): Promise<AxiosResponse<TourSpotResponse>> => {
    return await restClient.post('/tour/spot', request);
};
