import { Coordinates } from '@guide-me-app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { City, CityDocument } from '../../city/schemas/city.schema';
import { TourSpot, TourSpotDocument } from './tour.spot.schema';

@Schema()
export class Tour {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, type: mongoose.Types.ObjectId, ref: City.name })
    city: CityDocument;

    @Prop({
        required: true,
        type: [{ latitude: { type: Number }, longitude: { type: Number } }]
    })
    directions: Coordinates[];

    @Prop({ required: true, type: [mongoose.Types.ObjectId], ref: TourSpot.name })
    tourSpots: TourSpotDocument[];

    @Prop()
    video: string;
}

export const TourSchema = SchemaFactory.createForClass(Tour);
export type TourDocument = HydratedDocument<Tour>;
