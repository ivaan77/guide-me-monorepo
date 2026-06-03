import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  LatLngSub,
  LatLngSubSchema,
  LocalizedAudioSub,
  LocalizedAudioSubSchema,
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

  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  // Per-stop arrival radius in meters. Falls back to the mobile default
  // when unset; lets editors widen geofencing for stops in dense areas
  // or tighten it for precise photo-ops.
  @Prop()
  triggerRadius?: number;
}

const ExcursionStopSubSchema = SchemaFactory.createForClass(ExcursionStopSub);

// Excursion POIs are references into the canonical places collection.
// `placeSlug` joins on DiscoverPlace.slug; `order` is per-excursion so the
// same place can sit in different positions in different routes.
@Schema({ _id: false })
class ExcursionPoiRefSub {
  @Prop({ required: true }) placeSlug: string;
  @Prop({ required: true }) order: number;
}

const ExcursionPoiRefSubSchema =
  SchemaFactory.createForClass(ExcursionPoiRefSub);

// Free-form narration cards attached to an excursion (not tied to any stop).
// Each has its own localized audio.
@Schema({ _id: false })
class InterestingFactSub {
  @Prop({ required: true }) slug: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  title: LocalizedStringSub;

  @Prop({ type: LocalizedAudioSubSchema, required: true })
  audioUrl: LocalizedAudioSub;
}

const InterestingFactSubSchema =
  SchemaFactory.createForClass(InterestingFactSub);

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

  @Prop({ type: [ExcursionPoiRefSubSchema], default: [] })
  pois: ExcursionPoiRefSub[];

  @Prop({ type: [InterestingFactSubSchema], default: [] })
  interestingFacts: InterestingFactSub[];

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;
}

export type DiscoverExcursionDocument = HydratedDocument<DiscoverExcursion>;
export const DiscoverExcursionSchema =
  SchemaFactory.createForClass(DiscoverExcursion);
