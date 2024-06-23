import { AllCityResponse, CityByIdResponse, SaveCityRequest } from '@guide-me-app/core';
import axios, { AxiosPromise } from 'axios';

const restClient = axios.create({ baseURL: '/api' });

export const getAllCities = async (): AxiosPromise<AllCityResponse> => {
    return await restClient.get('/city');
};

export const saveCity = async (request: SaveCityRequest): AxiosPromise<CityByIdResponse> => {
    return await restClient.post('/city', request);
};