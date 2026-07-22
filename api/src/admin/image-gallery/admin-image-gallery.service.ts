import { Injectable } from '@nestjs/common';
import type {
  AdminImageGalleryResponse,
  ImageGalleryEntry,
  ImageGallerySource,
} from '@guide-me-app/core';
import { DiscoverRepository } from '../../discover/discover.repository';
import { BlogRepository } from '../../blog/blog.repository';

// Walks the content docs and returns every distinct image URL that's
// already been referenced somewhere. Cheap enough at current scale
// (~dozens of docs) to compute on every call without caching; add a
// CacheModule wrap here if we outgrow that.
@Injectable()
export class AdminImageGalleryService {
  constructor(
    private readonly discover: DiscoverRepository,
    private readonly blogs: BlogRepository,
  ) {}

  async list(): Promise<AdminImageGalleryResponse> {
    const [cities, places, excursions, blogPosts] = await Promise.all([
      this.discover.findAllCitiesAdmin(),
      this.discover.findAllPlacesAdmin(),
      this.discover.findAllExcursionsAdmin(),
      this.blogs.findAll(),
    ]);

    // Dedupe by URL. First-seen wins for source labels so the modal has
    // stable labels between refreshes as long as the underlying source
    // order stays stable.
    const seen = new Map<string, ImageGalleryEntry>();
    const push = (
      url: string | undefined | null,
      source: ImageGallerySource,
      sourceLabel: string,
    ): void => {
      if (!url) return;
      const trimmed = url.trim();
      if (!trimmed) return;
      if (seen.has(trimmed)) return;
      seen.set(trimmed, { url: trimmed, source, sourceLabel });
    };

    for (const city of cities) {
      push(city.image, 'city', city.name?.en ?? city.slug);
    }
    for (const place of places) {
      const label = place.name?.en ?? place.slug;
      push(place.image, 'place', label);
      for (const extra of place.images ?? []) {
        push(extra, 'place', label);
      }
    }
    for (const excursion of excursions) {
      const label = excursion.name?.en ?? excursion.slug;
      push(excursion.image, 'excursion', label);
      // Stops + sub-stops carry their own images too. Same author might
      // want to reuse a stop cover on a blog cover, so surface them.
      for (const stop of excursion.stops ?? []) {
        push(stop.image, 'excursion', label);
        for (const extra of stop.images ?? []) {
          push(extra, 'excursion', label);
        }
        for (const sub of stop.subStops ?? []) {
          push(sub.image, 'excursion', label);
          for (const extra of sub.images ?? []) {
            push(extra, 'excursion', label);
          }
        }
      }
      if (excursion.intro?.image) {
        push(excursion.intro.image, 'excursion', label);
      }
      for (const extra of excursion.intro?.images ?? []) {
        push(extra, 'excursion', label);
      }
      if (excursion.outro?.image) {
        push(excursion.outro.image, 'excursion', label);
      }
      for (const extra of excursion.outro?.images ?? []) {
        push(extra, 'excursion', label);
      }
      for (const fact of excursion.interestingFacts ?? []) {
        // Fact image is optional; keeps this defensive against future
        // schema shape drift.
        const img = (fact as unknown as { image?: string }).image;
        push(img, 'excursion', label);
      }
    }
    for (const post of blogPosts) {
      const label = post.title?.en ?? post.slug;
      push(post.coverImage, 'blog', label);
      push(post.ogImage, 'blog', label);
    }

    return { entries: Array.from(seen.values()) };
  }
}
