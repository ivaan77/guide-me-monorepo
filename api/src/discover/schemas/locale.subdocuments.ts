import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Subdocument: localized text. en is required; other locales optional.
@Schema({ _id: false })
export class LocalizedStringSub {
  @Prop({ required: true }) en: string;
  @Prop() de?: string;
  @Prop() hr?: string;
}

export const LocalizedStringSubSchema =
  SchemaFactory.createForClass(LocalizedStringSub);

@Schema({ _id: false })
export class LatLngSub {
  @Prop({ required: true }) latitude: number;
  @Prop({ required: true }) longitude: number;
}

export const LatLngSubSchema = SchemaFactory.createForClass(LatLngSub);

// Subdocument: localized media URL. All locales optional — a stop may have no
// audio at all, or only one language uploaded.
@Schema({ _id: false })
export class LocalizedAudioSub {
  @Prop() en?: string;
  @Prop() de?: string;
  @Prop() hr?: string;
}

export const LocalizedAudioSubSchema =
  SchemaFactory.createForClass(LocalizedAudioSub);
