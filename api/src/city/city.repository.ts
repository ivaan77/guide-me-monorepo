import mongoose, { Model, Schema, Types } from 'mongoose';

export type CityModel = {
    _id: Types.ObjectId;
    name: string;
}

export type SaveCityModel = Omit<CityModel, '_id'>;

const schema = new Schema<CityModel>({
    name: { type: String, required: true },
});

const cityModel: Model<CityModel> = mongoose.model('City', schema);

export const saveCity = async (city: SaveCityModel): Promise<CityModel> => {
    const data = new cityModel({ name: city.name });
    try {
        const result = await data.save() as CityModel;
        console.log('saved city', result);
        return result;
    } catch (e) {
        console.error('Failed to save city', e);
    }
};

export const deleteCity = async (id: string): Promise<void> => {
    try {

        const city = await cityModel.findById(id);
        await city.deleteOne();
        console.log('deleted city', id);
    } catch (e) {
        console.error('Failed to delete city', e);
    }
};

export const getCityById = async (id: string): Promise<CityModel> => {
    try {
        const result = await cityModel.findById(id) as CityModel;
        console.log('city', result);
        return result;
    } catch (e) {
        console.error('Failed to fetch city', e);
    }
};

export const getAllCities = async (): Promise<CityModel[]> => {
    try {
        const result = await cityModel.find({});
        console.log('city', result);
        return result;
    } catch (e) {
        console.error('Failed to fetch city', e);
    }
};
