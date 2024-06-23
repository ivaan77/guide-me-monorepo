export type SaveCityRequest = {
    name: string;
};
export type City = {
    id: string;
    name: string;
};
export type AllCityResponse = {
    cities: City[];
};
export type CityByIdResponse = {
    city: City;
};
