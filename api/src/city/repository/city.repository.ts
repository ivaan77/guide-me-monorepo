import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City, CityDocument } from '../schemas/city.schema';

export type SaveCityDto = {
    name: string;
}

@Injectable()
export class CityRepository {
    constructor(@InjectModel(City.name) private cityModel: Model<City>) {
    }

    async saveCity(city: SaveCityDto): Promise<CityDocument> {
        try {
            const createdCity = new this.cityModel(city);
            return await createdCity.save();
        } catch (e) {
            console.error('Failed to save city', e);
        }
    };

    async deleteCity(id: string): Promise<void> {
        try {
            await this.cityModel.findByIdAndDelete(id);
        } catch (e) {
            console.error('Failed to delete city', e);
        }
    };

    async getCityById(id: string): Promise<CityDocument> {
        try {
            return await this.cityModel.findById(id) as CityDocument;
        } catch (e) {
            console.error('Failed to fetch city', e);
        }
    };

    async getAllCities(): Promise<CityDocument[]> {
        try {
            return await this.cityModel.find({});
        } catch (e) {
            console.error('Failed to fetch cities', e);
        }
    };
}
