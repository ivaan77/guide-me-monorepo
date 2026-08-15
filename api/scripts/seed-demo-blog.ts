// One-shot demo blog post seeder. Creates (or refreshes) a single
// `demo-story` post that exercises every feature the platform supports:
//
//   - Localized title + excerpt (en/de/hr)
//   - Localized rich-text body with:
//       * headings (h2 + h3)
//       * bold, italic, and link marks
//       * bullet + ordered lists
//       * blockquote
//       * hard rule
//       * inline image (URL-based)
//       * YouTube embed
//       * inline link
//       * editorPick nodes (Tip + Highlight)
//       * appLink cards (city, excursion, place — one each if the DB has
//         any; falls back to skipping the appLink cards otherwise)
//   - Cover image + OG image
//   - metaTitle + metaDescription overrides
//   - citySlug tied to the first city in the DB (falls back to unset)
//   - Random previewToken
//   - Category: 'city-guide' (arbitrary; any of the 4 works)
//   - Status: 'published' so it shows up on the mobile + web surfaces
//
// Idempotent: uses upsert on slug so re-running refreshes the payload
// without duplicating docs. Existing publishedAt is preserved to
// simulate what admin CRUD does.
//
// Usage:
//   yarn workspace @guide-me-app/api script:seed-demo-blog
/* eslint-disable no-console */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { randomBytes } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { Blog } from '../src/blog/schemas/blog.schema';
import { DiscoverCity } from '../src/discover/schemas/discover-city.schema';
import { DiscoverExcursion } from '../src/discover/schemas/discover-excursion.schema';
import { DiscoverPlace } from '../src/discover/schemas/discover-place.schema';

const DEMO_SLUG = 'demo-story';

// Public Unsplash + YouTube URLs. Chosen so the demo works out of the
// box without needing you to upload anything first.
const COVER_URL =
  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1600';
const OG_URL =
  'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1200';
const INLINE_IMAGE_URL =
  'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1200';
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Helper: build a text run with optional marks. Keeps the doc literals
// readable — otherwise every text node is a 5-line JSON blob.
function text(t: string, marks?: Array<{ type: string; attrs?: unknown }>) {
  const node: Record<string, unknown> = { type: 'text', text: t };
  if (marks) node.marks = marks;
  return node;
}
function p(...children: unknown[]) {
  return { type: 'paragraph', content: children };
}
function h2(t: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [text(t)] };
}
function h3(t: string) {
  return { type: 'heading', attrs: { level: 3 }, content: [text(t)] };
}
function li(...children: unknown[]) {
  return { type: 'listItem', content: [p(...children)] };
}

// Build the localized TipTap body. `appLinkNodes` is passed in because
// which appLink cards to include depends on what's in the DB at seed
// time.
function buildBody(appLinkNodes: unknown[]) {
  return {
    type: 'doc',
    content: [
      p(
        text(
          'This is a demo story that exercises every block and mark type the editor supports. ',
        ),
        text('Bold text', [{ type: 'bold' }]),
        text(' sits next to '),
        text('italic text', [{ type: 'italic' }]),
        text(' and a '),
        text('regular link', [
          {
            type: 'link',
            attrs: { href: 'https://heylocal.xyz' },
          },
        ]),
        text('. Read on to see the full toolkit in action.'),
      ),
      h2('Rich text and formatting'),
      p(
        text(
          'Headings, bold, italic, links, and lists are all part of the base editor.',
        ),
      ),
      {
        type: 'bulletList',
        content: [
          li(text('Bullet lists work.')),
          li(
            text('So do '),
            text('nested', [{ type: 'italic' }]),
            text(' marks inside items.'),
          ),
          li(text('And you can mix them freely.')),
        ],
      },
      h3('Ordered lists too'),
      {
        type: 'orderedList',
        content: [
          li(text('First step.')),
          li(text('Second step.')),
          li(text('Third step.')),
        ],
      },
      {
        type: 'blockquote',
        content: [
          p(
            text(
              'Blockquotes are useful for pull quotes or setting off a source. They render with a left border on both web and mobile.',
            ),
          ),
        ],
      },
      { type: 'horizontalRule' },
      h2('Callout cards'),
      p(
        text(
          'Two callout variants for pulling important info out of the flow:',
        ),
      ),
      {
        type: 'editorPick',
        attrs: {
          variant: 'tip',
          title: 'Book Sunday brunch two days ahead',
          body: 'Weekend spots fill up fast. Locals reserve their favorite tables mid-week — do the same and you skip the queue.',
        },
      },
      {
        type: 'editorPick',
        attrs: {
          variant: 'highlight',
          title: 'What to bring',
          body: 'Comfortable shoes, a water bottle, and layers for changeable weather. The city looks different from up close — you will walk more than you think.',
        },
      },
      h2('Images and video'),
      p(text('Drop images inline anywhere in the body:')),
      { type: 'image', attrs: { src: INLINE_IMAGE_URL, alt: '' } },
      p(text('Embed YouTube by pasting a URL:')),
      { type: 'youtube', attrs: { src: YOUTUBE_URL } },
      h2('App links'),
      p(
        text(
          'These cards deep-link into the app. On mobile they navigate straight to the referenced city, excursion, or place. On web they link back to the marketing site (per-entity pages coming later).',
        ),
      ),
      ...appLinkNodes,
      { type: 'horizontalRule' },
      h2('Wrapping up'),
      p(
        text(
          'That covers every feature the platform supports right now. Use this as a reference when you write your own — every block above corresponds to a toolbar button in the admin editor.',
        ),
      ),
    ],
  };
}

async function main() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule, {
      logger: ['warn', 'error', 'log'],
    });

  try {
    const blogModel = app.get<Model<Blog>>(getModelToken(Blog.name));
    const cityModel = app.get<Model<DiscoverCity>>(
      getModelToken(DiscoverCity.name),
    );
    const excursionModel = app.get<Model<DiscoverExcursion>>(
      getModelToken(DiscoverExcursion.name),
    );
    const placeModel = app.get<Model<DiscoverPlace>>(
      getModelToken(DiscoverPlace.name),
    );

    // Pick the first enabled city — or fall back to `undefined` if the
    // DB has none. Same lookup pattern for excursion + place appLink
    // cards. All three are optional in the payload; missing content
    // just skips the corresponding card.
    const firstCity = await cityModel
      .findOne({ isEnabled: true })
      .sort({ slug: 1 })
      .lean<{ slug: string; name: { en: string }; image: string }>()
      .exec();
    const firstExcursion = await excursionModel
      .findOne({ isEnabled: true })
      .sort({ slug: 1 })
      .lean<{ slug: string; name: { en: string }; image: string }>()
      .exec();
    const firstPlace = await placeModel
      .findOne({ isEnabled: true })
      .sort({ slug: 1 })
      .lean<{ slug: string; name: { en: string }; image: string }>()
      .exec();

    console.log('Content available for appLink cards:');
    console.log('  city:      ', firstCity?.slug ?? '(none)');
    console.log('  excursion: ', firstExcursion?.slug ?? '(none)');
    console.log('  place:     ', firstPlace?.slug ?? '(none)');

    const appLinkNodes: unknown[] = [];
    if (firstCity) {
      appLinkNodes.push({
        type: 'appLink',
        attrs: {
          kind: 'city',
          id: firstCity.slug,
          label: firstCity.name.en,
          imageUrl: firstCity.image,
        },
      });
    }
    if (firstExcursion) {
      appLinkNodes.push({
        type: 'appLink',
        attrs: {
          kind: 'excursion',
          id: firstExcursion.slug,
          label: firstExcursion.name.en,
          imageUrl: firstExcursion.image,
        },
      });
    }
    if (firstPlace) {
      appLinkNodes.push({
        type: 'appLink',
        attrs: {
          kind: 'place',
          id: firstPlace.slug,
          label: firstPlace.name.en,
          imageUrl: firstPlace.image,
        },
      });
    }
    if (appLinkNodes.length === 0) {
      // Placeholder paragraph so the "App links" section doesn't look
      // empty when the DB has zero content. Rare in practice.
      appLinkNodes.push({
        type: 'paragraph',
        content: [
          text(
            '(No city / excursion / place exists yet in the DB — appLink cards were skipped.)',
          ),
        ],
      });
    }

    const body = buildBody(appLinkNodes);

    // Localize: EN authored, DE + HR left absent so we can also see the
    // fallback-to-English behavior at read time. If you want to see all
    // three languages populated, duplicate `body` into each locale.
    const doc = {
      slug: DEMO_SLUG,
      status: 'published' as const,
      category: 'city-guide' as const,
      citySlug: firstCity?.slug,
      coverImage: COVER_URL,
      ogImage: OG_URL,
      title: {
        en: 'A demo story: every feature the blog supports',
        de: 'Demo-Story: alle Features des Blogs',
        hr: 'Demo priča: sve funkcionalnosti bloga',
      },
      excerpt: {
        en: 'A single post that shows off every block, mark, and card type the editor can produce — headings, lists, images, YouTube, app links, tips, and highlights.',
        de: 'Ein einziger Beitrag, der jeden Block-, Mark- und Kartentyp zeigt, den der Editor erzeugen kann — Überschriften, Listen, Bilder, YouTube, App-Links, Tipps und Hinweise.',
        hr: 'Jedan post koji prikazuje sve tipove blokova, oznaka i kartica koje editor može proizvesti — naslove, liste, slike, YouTube, aplikacijske veze, savjete i istaknute informacije.',
      },
      body: {
        en: body,
        // Reuse the same EN body under de/hr slots so the locale switcher
        // actually renders localized-ish content. In real posts you'd
        // author each locale separately.
        de: body,
        hr: body,
      },
      metaTitle: {
        en: 'Demo: every blog feature in one post',
      },
      metaDescription: {
        en: 'Reference post showing every editor block, card, and mark type. Use this as a template when writing new stories.',
      },
    };

    // Upsert: preserve existing publishedAt + previewToken across re-runs
    // so any shared preview URL keeps working. Insert defaults on first
    // create only.
    const existing = await blogModel.findOne({ slug: DEMO_SLUG }).lean().exec();
    if (existing) {
      await blogModel
        .updateOne(
          { slug: DEMO_SLUG },
          {
            $set: {
              ...doc,
              // status/publishedAt kept in sync: if the existing doc was
              // draft, publishing here stamps publishedAt if missing.
              publishedAt:
                existing.publishedAt ??
                (doc.status === 'published' ? new Date() : undefined),
            },
          },
        )
        .exec();
      console.log(`Refreshed existing demo post: ${DEMO_SLUG}`);
    } else {
      await blogModel.create({
        ...doc,
        publishedAt: new Date(),
        previewToken: randomBytes(16).toString('hex'),
      });
      console.log(`Created demo post: ${DEMO_SLUG}`);
    }

    const saved = await blogModel
      .findOne({ slug: DEMO_SLUG })
      .lean<{ slug: string; previewToken: string; citySlug?: string }>()
      .exec();
    if (saved) {
      console.log('');
      console.log('Demo blog post is live:');
      console.log(`  slug:         ${saved.slug}`);
      console.log(`  citySlug:     ${saved.citySlug ?? '(none)'}`);
      console.log(`  previewToken: ${saved.previewToken}`);
      console.log('');
      console.log('URLs (adjust host as needed):');
      console.log(`  Web article:  http://localhost:3000/blog/${saved.slug}`);
      console.log(
        `  Web preview:  http://localhost:3000/blog/preview/${saved.slug}?token=${saved.previewToken}`,
      );
      console.log(`  Mobile deep-link: /story/${saved.slug}`);
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
