import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  LocalizedAudioDurationSub,
  LocalizedAudioDurationSubSchema,
  LocalizedAudioSub,
  LocalizedAudioSubSchema,
  LocalizedStringSub,
  LocalizedStringSubSchema,
} from './locale.subdocuments';

@Schema({ _id: false })
class EditorPickSub {
  @Prop({ type: LocalizedStringSubSchema, required: true })
  headline: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  tagline: LocalizedStringSub;
}

const EditorPickSubSchema = SchemaFactory.createForClass(EditorPickSub);

@Schema({ collection: 'cities', timestamps: true })
export class DiscoverCity {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  country: LocalizedStringSub;

  @Prop({ type: EditorPickSubSchema })
  editorPick?: EditorPickSub;

  // City-level audio narration (optional, per locale).
  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  // Server-populated. See LocalizedAudioDurationSub.
  @Prop({ type: LocalizedAudioDurationSubSchema, default: {} })
  audioDurationMs?: LocalizedAudioDurationSub;

  // Slugs of Places this city displays in its detail screen. Order is preserved.
  // The api resolves these to full Place docs at read time.
  @Prop({ type: [String], default: [] })
  cityPlaceSlugs: string[];

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;

  // Denormalized rating aggregate — sum of every rating value ever cast for
  // this city and the count of those ratings. Updated atomically with the
  // rating write. Averages are computed on serialization (sum/count).
  @Prop({ type: Number, default: 0 })
  ratingSum: number;

  @Prop({ type: Number, default: 0 })
  ratingCount: number;

  // Public web gallery inclusion + ordering — see DiscoverPlace for the
  // full contract.
  @Prop({ required: true, default: false, index: true })
  webFeatured: boolean;

  @Prop({ type: Number, default: 0 })
  webFeaturedOrder: number;
}

export type DiscoverCityDocument = HydratedDocument<DiscoverCity>;
export const DiscoverCitySchema = SchemaFactory.createForClass(DiscoverCity);
