import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
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

  // Slugs of Places this city displays in its detail screen. Order is preserved.
  // The api resolves these to full Place docs at read time.
  @Prop({ type: [String], default: [] })
  cityPlaceSlugs: string[];

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;
}

export type DiscoverCityDocument = HydratedDocument<DiscoverCity>;
export const DiscoverCitySchema = SchemaFactory.createForClass(DiscoverCity);
