import { Coordinates } from '@guide-me-app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TourSpotDocument = HydratedDocument<TourSpot>;

@Schema()
export class TourSpot {
    @Prop({ required: true })
    name: string;

    @Prop([String])
    images: string[];

    @Prop({ required: true })
    audio: string;

    @Prop({ required: true, type: [{ latitude: { type: Number }, longitude: { type: Number } }] })
    location: Coordinates;
}

export const TourSpotSchema = SchemaFactory.createForClass(TourSpot);
