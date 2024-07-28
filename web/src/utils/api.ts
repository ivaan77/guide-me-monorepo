import { UploadResponse } from '@/app/api/upload/route';
import { AllCityResponse, CityByIdResponse, CreateTourSpotRequest, SaveCityRequest, TourSpotResponse } from '@guide-me-app/core';
import axios, { AxiosPromise } from 'axios';

const restClient = axios.create({ baseURL: '/api' });

export const getAllCities = async (): AxiosPromise<AllCityResponse> => {
    return await restClient.get('/city');
};

export const saveCity = async (request: SaveCityRequest): AxiosPromise<CityByIdResponse> => {
    return await restClient.post('/city', request);
};

export const uploadFile = async (file: File): AxiosPromise<UploadResponse> => {
    const formData = new FormData();
    formData.set('file', file);

    return await restClient.post('/upload', formData);
};

export const saveTourSpot = async (request: CreateTourSpotRequest): AxiosPromise<TourSpotResponse> => {
    return await restClient.post('/tour/spot', request);
};
