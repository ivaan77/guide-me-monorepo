import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  LatLngSub,
  LatLngSubSchema,
  LocalizedStringSub,
  LocalizedStringSubSchema,
} from './locale.subdocuments';

@Schema({ _id: false })
class ExcursionStopSub {
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) order: number;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  description: LocalizedStringSub;

  @Prop({ type: LatLngSubSchema, required: true })
  coords: LatLngSub;

  @Prop({ required: true }) image: string;
  @Prop([String]) images?: string[];
  @Prop() audioUrl?: string;
}

const ExcursionStopSubSchema = SchemaFactory.createForClass(ExcursionStopSub);

@Schema({ _id: false })
class PoiSub {
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) order: number;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ required: true, enum: ['restaurant', 'bar', 'shopping'] })
  category: 'restaurant' | 'bar' | 'shopping';

  @Prop({ type: LocalizedStringSubSchema, required: true })
  description: LocalizedStringSub;

  @Prop({ type: LatLngSubSchema, required: true })
  coords: LatLngSub;

  @Prop({ required: true }) image: string;
  @Prop([String]) images?: string[];
}

const PoiSubSchema = SchemaFactory.createForClass(PoiSub);

@Schema({ collection: 'excursions', timestamps: true })
export class DiscoverExcursion {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  citySlug: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  meta: LocalizedStringSub;

  @Prop({ required: true })
  image: string;

  @Prop({ type: [ExcursionStopSubSchema], default: [] })
  stops: ExcursionStopSub[];

  @Prop({ type: [PoiSubSchema] })
  pois?: PoiSub[];

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;
}

export type DiscoverExcursionDocument = HydratedDocument<DiscoverExcursion>;
export const DiscoverExcursionSchema =
  SchemaFactory.createForClass(DiscoverExcursion);
