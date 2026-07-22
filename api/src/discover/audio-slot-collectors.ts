import type { AudioSlot } from './audio-duration-reconciler';
import type {
  DiscoverExcursion,
  DiscoverExcursionDocument,
} from './schemas/discover-excursion.schema';
import type { DiscoverCity } from './schemas/discover-city.schema';
import type { DiscoverPlace } from './schemas/discover-place.schema';

// Collects every ({urls}, {durations}) pair on an excursion draft — top-level
// stops, sub-stops nested inside bundle stops, outro, and interesting facts.
// `draft` is the shape we're about to insert / update (mutable), `existing`
// is the previously-stored document keyed by slug so we can preserve
// durations for URLs that haven't changed.
export function collectExcursionAudioSlots(
  draft: Partial<DiscoverExcursion>,
  existing: DiscoverExcursionDocument | null,
): AudioSlot[] {
  const slots: AudioSlot[] = [];

  // ---- Stops (indexed by slug for prev lookup) ----
  const stopsDraft = draft.stops;
  if (stopsDraft) {
    const prevStopBySlug = new Map(
      (existing?.stops ?? []).map((s) => [s.slug, s] as const),
    );
    for (const stop of stopsDraft) {
      const prev = prevStopBySlug.get(stop.slug);
      // The stop itself.
      slots.push({
        urls: stop.audioUrl,
        prevDurations: prev?.audioDurationMs,
        write: (next) => {
          stop.audioDurationMs = next;
        },
      });
      // Its sub-stops (also keyed by slug).
      if (stop.subStops && stop.subStops.length > 0) {
        const prevSubBySlug = new Map(
          (prev?.subStops ?? []).map((s) => [s.slug, s] as const),
        );
        for (const sub of stop.subStops) {
          const prevSub = prevSubBySlug.get(sub.slug);
          slots.push({
            urls: sub.audioUrl,
            prevDurations: prevSub?.audioDurationMs,
            write: (next) => {
              sub.audioDurationMs = next;
            },
          });
        }
      }
    }
  }

  // ---- Interesting facts (indexed by slug) ----
  const factsDraft = draft.interestingFacts;
  if (factsDraft) {
    const prevFactBySlug = new Map(
      (existing?.interestingFacts ?? []).map((f) => [f.slug, f] as const),
    );
    for (const fact of factsDraft) {
      const prev = prevFactBySlug.get(fact.slug);
      slots.push({
        urls: fact.audioUrl,
        prevDurations: prev?.audioDurationMs,
        write: (next) => {
          fact.audioDurationMs = next;
        },
      });
    }
  }

  // ---- Intro (singleton, so no key needed) ----
  if (draft.intro) {
    const prevIntro = existing?.intro;
    slots.push({
      urls: draft.intro.audioUrl,
      prevDurations: prevIntro?.audioDurationMs,
      write: (next) => {
        if (draft.intro) draft.intro.audioDurationMs = next;
      },
    });
  }

  // ---- Outro (singleton, so no key needed) ----
  if (draft.outro) {
    const prevOutro = existing?.outro;
    slots.push({
      urls: draft.outro.audioUrl,
      prevDurations: prevOutro?.audioDurationMs,
      write: (next) => {
        if (draft.outro) draft.outro.audioDurationMs = next;
      },
    });
  }

  return slots;
}

// City-level audio is one slot on the city doc.
export function collectCityAudioSlots(
  draft: Partial<DiscoverCity>,
  existing: { audioDurationMs?: DiscoverCity['audioDurationMs'] } | null,
): AudioSlot[] {
  if (!draft.audioUrl) return [];
  return [
    {
      urls: draft.audioUrl,
      prevDurations: existing?.audioDurationMs,
      write: (next) => {
        draft.audioDurationMs = next;
      },
    },
  ];
}

// Place-level audio is one slot on the place doc.
export function collectPlaceAudioSlots(
  draft: Partial<DiscoverPlace>,
  existing: { audioDurationMs?: DiscoverPlace['audioDurationMs'] } | null,
): AudioSlot[] {
  if (!draft.audioUrl) return [];
  return [
    {
      urls: draft.audioUrl,
      prevDurations: existing?.audioDurationMs,
      write: (next) => {
        draft.audioDurationMs = next;
      },
    },
  ];
}
