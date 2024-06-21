import mongoose, { Model, Schema, Types } from 'mongoose';

type City = {
    _id: Types.ObjectId;
    name: string;
}

const schema = new Schema<City>({
    name: { type: String, required: true },
});

const CityModel: Model<City> = mongoose.model('User', schema);

export const saveCity = async (city: Omit<City, '_id'>) => {
    const data = new CityModel({ name: city.name });
    console.log(city, data);
    try {
        const result = await data.save();
        console.log('saved city', result);
        return result;
    } catch (e) {
        console.error('Failed to save sity', e);
    }
};

export const getCityById = async (id: string) => {
    try {
        const result = await CityModel.findById(id);
        console.log('city', result);
        return result;
    } catch (e) {
        console.error('Failed to fetch city', e);
    }
};

export const getAllCities = async (): Promise<City[]> => {
    try {
        const result = await CityModel.find({});
        console.log('city', result);
        return result;
    } catch (e) {
        console.error('Failed to fetch city', e);
    }
};
