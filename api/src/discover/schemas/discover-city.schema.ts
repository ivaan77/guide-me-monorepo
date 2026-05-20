import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
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

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;
}

export type DiscoverCityDocument = HydratedDocument<DiscoverCity>;
export const DiscoverCitySchema = SchemaFactory.createForClass(DiscoverCity);
