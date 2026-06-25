import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FavoriteType } from '@guide-me-app/core';

@Schema({ _id: false })
class Favorite {
  @Prop({
    type: String,
    required: true,
    enum: ['city', 'excursion', 'place', 'sub-stop'],
  })
  type!: FavoriteType;

  // For city/excursion/place this is the entity's slug. For 'sub-stop' it
  // is a composite `excursionSlug:stopSlug:subStopSlug` — resolved by
  // walking from the excursion document.
  @Prop({ type: String, required: true })
  id!: string;
}

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, index: true })
  clerkUserId!: string;

  @Prop({ type: [Favorite], default: [] })
  favorites!: Favorite[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
