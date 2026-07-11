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

// Subdocument: per-locale audio duration in milliseconds. Paired with a
// LocalizedAudioSub — one duration slot per audio slot. Server-populated
// only: the admin service probes each new/changed audio URL with
// music-metadata and writes the duration here. Values are cleared back to
// 0 (or omitted) when the corresponding URL is removed. Feeds the public
// web stats "total narration hours" aggregate.
@Schema({ _id: false })
export class LocalizedAudioDurationSub {
  @Prop({ type: Number }) en?: number;
  @Prop({ type: Number }) de?: number;
  @Prop({ type: Number }) hr?: number;
}

export const LocalizedAudioDurationSubSchema = SchemaFactory.createForClass(
  LocalizedAudioDurationSub,
);
