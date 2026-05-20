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
