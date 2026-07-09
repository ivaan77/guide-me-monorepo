import { Injectable, Logger } from '@nestjs/common';
import { SUPPORTED_LOCALES, type Locale } from '@guide-me-app/core';
import { AudioProbeService } from './audio-probe.service';

// Every place we store per-locale audio in the discover collections is a
// pair of ({url1, url2, url3}, {ms1, ms2, ms3}) sub-documents. This module
// walks a document (excursion / city / place) and, for every audio slot
// whose URL has been added or changed relative to a previous state, probes
// the URL and writes the resolved duration back into the paired duration
// slot. URL removals clear the corresponding duration. Unchanged URLs are
// left untouched so we don't re-probe on every save.

type UrlMap = Partial<Record<Locale, string | undefined>>;
type DurationMap = Partial<Record<Locale, number | undefined>>;

// One slot pair on a document — we operate over these uniformly regardless
// of whether the slot lives on a stop, a fact, a city, or a place.
export type AudioSlot = {
  urls: UrlMap | undefined;
  prevDurations: DurationMap | undefined;
  // Writer applies the resolved DurationMap back to the source document.
  // Split from the read so callers control where the write lands.
  write: (next: DurationMap) => void;
};

@Injectable()
export class AudioDurationReconciler {
  private readonly logger = new Logger(AudioDurationReconciler.name);

  constructor(private readonly probe: AudioProbeService) {}

  // Reconcile every audio slot in `slots`. Probes URLs in parallel with a
  // shared per-URL cache so if two slots reference the same URL (rare but
  // possible) we only hit the network once. Never throws — every slot ends
  // up in a defined state (probed / preserved / zeroed).
  async reconcile(slots: AudioSlot[]): Promise<void> {
    // Build the intended output map for every slot up front — preserving
    // existing durations where the URL hasn't changed. Queue a URL-specific
    // fill-in for locales that need a fresh probe.
    type PendingFill = {
      target: DurationMap;
      locale: Locale;
    };
    const pending = new Map<string, PendingFill[]>();
    const outputs: { slot: AudioSlot; next: DurationMap }[] = [];

    for (const slot of slots) {
      const next: DurationMap = {};
      const urls = slot.urls ?? {};
      const prev = slot.prevDurations ?? {};
      for (const locale of SUPPORTED_LOCALES) {
        const url = urls[locale];
        if (!url) continue; // URL absent → duration absent
        const preserved = prev[locale];
        if (preserved && preserved > 0) {
          next[locale] = preserved;
          continue;
        }
        const list = pending.get(url) ?? [];
        list.push({ target: next, locale });
        pending.set(url, list);
      }
      outputs.push({ slot, next });
    }

    // Run every unique URL probe in parallel. Bounded per-URL by the probe
    // service's internal timeout, so the whole call is bounded to ~one
    // timeout window regardless of slot count.
    await Promise.all(
      Array.from(pending.entries()).map(async ([url, fills]) => {
        const ms = await this.probe.probeDurationMs(url);
        if (ms == null) return; // failure → leave slot's duration absent
        for (const fill of fills) fill.target[fill.locale] = ms;
      }),
    );

    // Commit resolved DurationMaps back to their slots.
    for (const { slot, next } of outputs) slot.write(next);
  }
}
