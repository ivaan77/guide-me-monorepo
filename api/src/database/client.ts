import 'dotenv/config';
import mongoose from 'mongoose';

export const connectToDatabase = () => {
    const dbUrl = process.env.MONGODB_URL;

    if (!dbUrl) {
        console.log('No db url or invalid', dbUrl);
        return;
    }

    try {
        mongoose.connect(dbUrl, {});
        console.log('Connected to database');
    } catch (e) {
        console.error('Error connecting to database', e);
    }
};
