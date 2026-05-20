import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  LocalizedStringSub,
  LocalizedStringSubSchema,
} from './locale.subdocuments';

@Schema({ collection: 'places', timestamps: true })
export class DiscoverPlace {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  citySlug: string;

  @Prop({ required: true, enum: ['restaurant', 'bar', 'shopping'], index: true })
  category: 'restaurant' | 'bar' | 'shopping';

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
}

export type DiscoverPlaceDocument = HydratedDocument<DiscoverPlace>;
export const DiscoverPlaceSchema = SchemaFactory.createForClass(DiscoverPlace);

// Compound index for city+category lookup (city detail screen loads each
// category for a single city — this index is hit frequently).
DiscoverPlaceSchema.index({ citySlug: 1, category: 1 });
