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

export const PLACE_CATEGORIES = [
  'restaurant',
  'cafe',
  'bar',
  'shopping',
  'event',
  'park',
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

@Schema({ collection: 'places', timestamps: true })
export class DiscoverPlace {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  citySlug: string;

  @Prop({
    required: true,
    enum: PLACE_CATEGORIES,
    index: true,
  })
  category: PlaceCategory;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  meta: LocalizedStringSub;

  @Prop({ required: true })
  image: string;

  @Prop({ type: LocalizedStringSubSchema })
  description?: LocalizedStringSub;

  @Prop([String])
  images?: string[];

  // Geographic location. Optional only because legacy non-excursion places
  // were authored before this field existed; new docs should always set it.
  @Prop({ type: LatLngSubSchema })
  coords?: LatLngSub;

  // Optional free-text sub-category label (localized).
  @Prop({ type: LocalizedStringSubSchema })
  subCategory?: LocalizedStringSub;

  // Optional localized audio narration.
  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;
}

export type DiscoverPlaceDocument = HydratedDocument<DiscoverPlace>;
export const DiscoverPlaceSchema = SchemaFactory.createForClass(DiscoverPlace);

// Compound index for city+category lookup (city detail screen loads each
// category for a single city — this index is hit frequently).
DiscoverPlaceSchema.index({ citySlug: 1, category: 1 });
