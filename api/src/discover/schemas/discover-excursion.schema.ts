import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  LatLngSub,
  LatLngSubSchema,
  LocalizedAudioDurationSub,
  LocalizedAudioDurationSubSchema,
  LocalizedAudioSub,
  LocalizedAudioSubSchema,
  LocalizedStringSub,
  LocalizedStringSubSchema,
} from './locale.subdocuments';

// One sub-stop inside a bundle. A "bundle" is a top-level ExcursionStopSub
// whose `subStops` array is non-empty — used when several distinct things
// (statue, fountain, building) share a single arrival location (a square).
// Order is implicit by array position; admin reorders via drag.
//
// `coords` is required on every sub-stop so each has a real pin on the
// map. (Legacy sub-stops without coords were backfilled before this field
// became required.)
@Schema({ _id: false })
class SubStopSub {
  @Prop({ required: true }) slug: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  description: LocalizedStringSub;

  @Prop({ type: LatLngSubSchema, required: true })
  coords: LatLngSub;

  @Prop({ required: true }) image: string;
  @Prop([String]) images?: string[];

  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  // Server-populated. See LocalizedAudioDurationSub.
  @Prop({ type: LocalizedAudioDurationSubSchema, default: {} })
  audioDurationMs?: LocalizedAudioDurationSub;
}

const SubStopSubSchema = SchemaFactory.createForClass(SubStopSub);

@Schema({ _id: false })
class ExcursionStopSub {
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) order: number;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  description: LocalizedStringSub;

  @Prop({ type: LatLngSubSchema, required: true })
  coords: LatLngSub;

  @Prop({ required: true }) image: string;
  @Prop([String]) images?: string[];

  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  // Server-populated. See LocalizedAudioDurationSub.
  @Prop({ type: LocalizedAudioDurationSubSchema, default: {} })
  audioDurationMs?: LocalizedAudioDurationSub;

  // Per-stop arrival radius in meters. Falls back to the mobile default
  // when unset; lets editors widen geofencing for stops in dense areas
  // or tighten it for precise photo-ops.
  @Prop()
  triggerRadius?: number;

  // When non-empty this stop becomes a "bundle" — mobile shows a numbered
  // pin, ignores this stop's own audioUrl, and on arrival sequences through
  // each sub-stop's name + description + audio.
  @Prop({ type: [SubStopSubSchema], default: [] })
  subStops?: SubStopSub[];
}

const ExcursionStopSubSchema = SchemaFactory.createForClass(ExcursionStopSub);

// Excursion POIs are references into the canonical places collection.
// `placeSlug` joins on DiscoverPlace.slug; `order` is per-excursion so the
// same place can sit in different positions in different routes.
@Schema({ _id: false })
class ExcursionPoiRefSub {
  @Prop({ required: true }) placeSlug: string;
  @Prop({ required: true }) order: number;
}

const ExcursionPoiRefSubSchema =
  SchemaFactory.createForClass(ExcursionPoiRefSub);

// Free-form narration cards attached to an excursion (not tied to any stop).
// Each has its own localized audio.
//
// Optional geocoded trigger: when `coords` is set, the mobile app fires the
// fact the moment the user is within `triggerRadius` meters (defaulting to
// a per-fact value if unset, then the mobile-wide default). Facts without
// coords fall back to the distance-along-leg heuristic.
@Schema({ _id: false })
class InterestingFactSub {
  @Prop({ required: true }) slug: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  title: LocalizedStringSub;

  @Prop({ type: LocalizedAudioSubSchema, required: true })
  audioUrl: LocalizedAudioSub;

  @Prop({ type: LatLngSubSchema })
  coords?: LatLngSub;

  @Prop()
  triggerRadius?: number;

  // Server-populated per-locale audio duration. See LocalizedAudioDurationSub.
  @Prop({ type: LocalizedAudioDurationSubSchema, default: {} })
  audioDurationMs?: LocalizedAudioDurationSub;
}

const InterestingFactSubSchema =
  SchemaFactory.createForClass(InterestingFactSub);

// Optional sign-off shown after the user finishes (or skips past) the
// last stop. Lets editors author a thank-you + final recommendations
// without faking a GPS-bound stop. When unset, mobile transitions
// straight from the last stop to the complete screen.
@Schema({ _id: false })
class OutroSub {
  @Prop({ type: LocalizedStringSubSchema, required: true })
  title: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  description: LocalizedStringSub;

  @Prop({ required: true }) image: string;
  @Prop([String]) images?: string[];

  @Prop({ type: LocalizedAudioSubSchema })
  audioUrl?: LocalizedAudioSub;

  // Server-populated. See LocalizedAudioDurationSub.
  @Prop({ type: LocalizedAudioDurationSubSchema, default: {} })
  audioDurationMs?: LocalizedAudioDurationSub;
}

const OutroSubSchema = SchemaFactory.createForClass(OutroSub);

@Schema({ collection: 'excursions', timestamps: true })
export class DiscoverExcursion {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, index: true })
  citySlug: string;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  name: LocalizedStringSub;

  @Prop({ type: LocalizedStringSubSchema, required: true })
  meta: LocalizedStringSub;

  @Prop({ required: true })
  image: string;

  @Prop({ type: [ExcursionStopSubSchema], default: [] })
  stops: ExcursionStopSub[];

  @Prop({ type: [ExcursionPoiRefSubSchema], default: [] })
  pois: ExcursionPoiRefSub[];

  @Prop({ type: [InterestingFactSubSchema], default: [] })
  interestingFacts: InterestingFactSub[];

  // Optional outro card shown after the last stop. See OutroSub above.
  @Prop({ type: OutroSubSchema })
  outro?: OutroSub;

  @Prop({ required: true, default: true, index: true })
  isEnabled: boolean;

  // Denormalized rating aggregate. See DiscoverCity for the pattern.
  @Prop({ type: Number, default: 0 })
  ratingSum: number;

  @Prop({ type: Number, default: 0 })
  ratingCount: number;
}

export type DiscoverExcursionDocument = HydratedDocument<DiscoverExcursion>;
export const DiscoverExcursionSchema =
  SchemaFactory.createForClass(DiscoverExcursion);
