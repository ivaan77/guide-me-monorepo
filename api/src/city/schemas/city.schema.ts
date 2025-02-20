import { Coordinates } from '@guide-me-app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CityDocument = HydratedDocument<City>;

@Schema()
export class City {
  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    type: { latitude: { type: Number }, longitude: { type: Number } },
  })
  location: Coordinates;

  @Prop({ required: false })
  introAudio: string;

  @Prop({ required: false })
  outroAudio: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
