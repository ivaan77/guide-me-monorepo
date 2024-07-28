import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import 'dotenv/config';
import { CityModule } from './city/city.module';
import { TourModule } from './tour/tour.module';

const dbUrl = process.env.MONGODB_URL;

@Module({
    imports: [MongooseModule.forRoot(dbUrl), TourModule, CityModule],
    controllers: [],
    providers: [],
})
export class AppModule {
}
