import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { FavoriteType } from '@guide-me-app/core';

@Schema({ _id: false })
class Favorite {
  @Prop({ type: String, required: true, enum: ['city', 'excursion', 'place'] })
  type!: FavoriteType;

  @Prop({ type: String, required: true })
  id!: string; // slug of the city/excursion/place
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
