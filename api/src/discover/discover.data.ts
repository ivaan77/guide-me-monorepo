import { Locale, LocalizedString, PoiCategory } from '@guide-me-app/core';

// Data structure mirrors what we'll persist in Mongo:
//   { _id, slug, image, name: { en, de, hr }, country: { en, de, hr }, editorPick: { ... }, excursions: [...], restaurants: [...], bars: [...], shopping: [...] }
// The API resolves localized strings to flat strings before responding.
// Adding a language = filling more keys under each localized object.
// Missing translation = falls back to English at resolve time.
//
// Authoring guidance:
//   - Only `en` is required on every LocalizedString.
//   - `de` / `hr` are optional; absent values fall back to en.
//   - Coordinates, image URLs, and audioUrl are never localized.
//   - `slug` identifies the entity in URLs and is stable across re-seeds.

export type LocalizedEditorPick = {
  headline: LocalizedString;
  tagline: LocalizedString;
};

export type CategoryItemRecord = {
  slug: string;
  name: LocalizedString;
  meta: LocalizedString;
  image: string;
  description?: LocalizedString;
  images?: string[];
};

export type LatLngRecord = {
  latitude: number;
  longitude: number;
};

export type ExcursionStopRecord = {
  slug: string;
  order: number;
  name: LocalizedString;
  description: LocalizedString;
  coords: LatLngRecord;
  image: string;
  images?: string[];
  audioUrl?: string;
};

export type PoiRecord = {
  slug: string;
  order: number;
  name: LocalizedString;
  category: PoiCategory;
  description: LocalizedString;
  coords: LatLngRecord;
  image: string;
  images?: string[];
};

export type ExcursionRecord = CategoryItemRecord & {
  stops: ExcursionStopRecord[];
  pois?: PoiRecord[];
};

export type CityRecord = {
  slug: string;
  image: string;
  name: LocalizedString;
  country: LocalizedString;
  editorPick?: LocalizedEditorPick;
  excursions?: ExcursionRecord[];
  restaurants?: CategoryItemRecord[];
  bars?: CategoryItemRecord[];
  shopping?: CategoryItemRecord[];
};

export function pickLocalized(
  field: LocalizedString,
  locale: Locale,
): string {
  return field[locale] ?? field.en;
}

const u = (id: string, w = 900): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Helper: make a LocalizedString with only English filled in. Used for fields
// that don't have translations yet — the resolver falls back to en for de/hr.
const en = (text: string): LocalizedString => ({ en: text });

export const CITY_RECORDS: CityRecord[] = [
  {
    slug: 'lisbon',
    image: u('photo-1513735492246-483525079686'),
    name: { en: 'Lisbon', de: 'Lissabon', hr: 'Lisabon' },
    country: { en: 'Portugal', de: 'Portugal', hr: 'Portugal' },
    editorPick: {
      headline: {
        en: "Editor's pick",
        de: 'Empfehlung der Redaktion',
        hr: 'Izbor urednika',
      },
      tagline: {
        en: 'Best in spring for sunlit miradouros and fado-lit nights.',
        de: 'Am schönsten im Frühling: sonnige Aussichtsplätze und Fado-Nächte.',
        hr: 'Najljepši u proljeće — sunčani vidikovci i noći uz fado.',
      },
    },
    excursions: [
      {
        slug: 'belem',
        name: {
          en: 'Belém Tower Walk',
          de: 'Spaziergang zum Turm von Belém',
          hr: 'Šetnja do Tornja Belém',
        },
        meta: { en: '3h · €35', de: '3 Std. · 35 €', hr: '3 h · 35 €' },
        image: u('photo-1555881400-74d7acaacd8b', 400),
        stops: [
          {
            slug: 'jeronimos',
            order: 0,
            name: {
              en: 'Jerónimos Monastery',
              de: 'Kloster Jerónimos',
              hr: 'Samostan Jerónimos',
            },
            description: {
              en: 'A UNESCO-listed cloister in white limestone, built to celebrate Vasco da Gama’s return from India. Construction began in 1501 under King Manuel I and continued for nearly a century, blending late-Gothic structure with the Manueline ornament that became Portugal’s signature style. Vasco da Gama, Luís de Camões, and Fernando Pessoa are all buried inside. Plan at least an hour for the church and cloister; arrive early in the day to beat the cruise-ship crowds.',
              de: 'Ein UNESCO-Weltkulturerbe-Kreuzgang aus weißem Kalkstein, errichtet zur Feier von Vasco da Gamas Rückkehr aus Indien. Der Bau begann 1501 unter König Manuel I. und dauerte fast ein Jahrhundert. Hier liegen Vasco da Gama, Luís de Camões und Fernando Pessoa begraben. Plane mindestens eine Stunde ein und komm früh, um den Kreuzfahrt-Andrang zu vermeiden.',
              hr: 'Klaustar od bijelog vapnenca pod zaštitom UNESCO-a, sagrađen u čast povratka Vasca da Game iz Indije. Gradnja je započela 1501. pod kraljem Manuelom I. i trajala je gotovo cijelo stoljeće. Ovdje su pokopani Vasco da Gama, Luís de Camões i Fernando Pessoa. Planiraj barem sat vremena i dođi rano kako bi izbjegao gužve s krstaša.',
            },
            coords: { latitude: 38.6979, longitude: -9.2068 },
            image: u('photo-1513735492246-483525079686', 400),
            images: [
              u('photo-1513735492246-483525079686', 800),
              u('photo-1555881400-74d7acaacd8b', 800),
              u('photo-1503853585905-d53f628e46ac', 800),
              u('photo-1483985988355-763728e1935b', 800),
            ],
          },
          {
            slug: 'pasteis',
            order: 2,
            name: {
              en: 'Pastéis de Belém',
              de: 'Pastéis de Belém',
              hr: 'Pastéis de Belém',
            },
            description: {
              en: 'The original 1837 bakery for Portugal’s iconic custard tart. The recipe is a closely guarded secret known only to a handful of bakers, passed down through five generations. Lines move quickly — head straight in, order at the counter, and grab a marble-topped table inside. Eat one warm with cinnamon and powdered sugar on top, paired with a bica (Lisbon espresso).',
              de: 'Die originale Bäckerei von 1837 für Portugals legendäre Puddingtörtchen. Das Rezept ist ein streng gehütetes Geheimnis, das nur einer Handvoll Bäcker bekannt ist. Geh hinein, bestelle am Tresen und schnapp dir einen Marmortisch im Inneren. Warm mit Zimt und Puderzucker, dazu eine bica.',
              hr: 'Originalna pekara iz 1837. u kojoj se peku ikonične portugalske kremaste tartice. Recept se ljubomorno čuva i poznaje ga tek nekoliko pekara. Naruči na pultu i sjedni za neki od mramornih stolova unutra. Pojedi je toplu, s cimetom i šećerom u prahu, uz bicu (lisabonski espresso).',
            },
            coords: { latitude: 38.6975, longitude: -9.2032 },
            image: u('photo-1567306226416-28f0efdc88ce', 400),
            images: [
              u('photo-1567306226416-28f0efdc88ce', 800),
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1414235077428-338989a2e8c0', 800),
            ],
          },
          {
            slug: 'belem-tower',
            order: 6,
            name: {
              en: 'Belém Tower',
              de: 'Turm von Belém',
              hr: 'Toranj Belém',
            },
            description: {
              en: 'A fortified Manueline lighthouse on the Tagus, completed in 1519 as the symbolic last sight of Lisbon for sailors heading to the New World. Carved sea ropes and twists in limestone, defensive balconies overlooking the river, and a rooftop terrace with sweeping views of the estuary. The narrow spiral staircase is one-way with timed entries — book online to skip the line.',
              de: 'Ein manuelinischer Wehrturm auf dem Tejo, 1519 fertiggestellt — der letzte Anblick Lissabons für Seefahrer auf dem Weg in die Neue Welt. Steinerne Schiffstaue, Verteidigungsbalkone und eine Dachterrasse mit Blick auf die Mündung. Die Treppe ist Einbahnstraße mit Zeitfenstern — online buchen.',
              hr: 'Utvrđeni manuelinski svjetionik na Taju, dovršen 1519. — posljednji pogled na Lisabon za pomorce koji su plovili u Novi svijet. Klesane brodske užadi u kamenu, obrambeni balkoni nad rijekom i krovna terasa s pogledom na ušće. Stube su jednosmjerne s vremenskim ulaznicama — rezerviraj online.',
            },
            coords: { latitude: 38.69175, longitude: -9.21595 },
            image: u('photo-1555881400-74d7acaacd8b', 400),
            images: [
              u('photo-1555881400-74d7acaacd8b', 800),
              u('photo-1513735492246-483525079686', 800),
              u('photo-1456428199391-a3b1cb5e93ab', 800),
              u('photo-1469854523086-cc02fe5d8800', 800),
            ],
          },
        ],
        pois: [
          {
            slug: 'darwin-cafe',
            order: 4,
            name: en("Darwin's Café"),
            category: 'restaurant',
            description: en(
              "Modern bistro hidden inside the Champalimaud Centre, with floor-to-ceiling windows over the Tagus. Lunch menu rotates weekly; the polvo (octopus) is a quiet local favorite.",
            ),
            coords: { latitude: 38.6932, longitude: -9.2173 },
            image: u('photo-1414235077428-338989a2e8c0', 400),
            images: [
              u('photo-1414235077428-338989a2e8c0', 800),
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1551024709-8f23befc6f87', 800),
            ],
          },
          {
            slug: 'enoteca-belem',
            order: 1,
            name: en('Enoteca de Belém'),
            category: 'bar',
            description: en(
              'Tiny corner wine bar a block off Rua de Belém. Iberian cheese boards, a focused Portuguese wine list, and conversation-friendly noise. Best at golden hour.',
            ),
            coords: { latitude: 38.6973, longitude: -9.2045 },
            image: u('photo-1551024709-8f23befc6f87', 400),
            images: [
              u('photo-1551024709-8f23befc6f87', 800),
              u('photo-1514362545857-3bc16c4c7d1b', 800),
              u('photo-1470337458703-46ad1756a187', 800),
            ],
          },
          {
            slug: 'centro-cultural',
            order: 5,
            name: en('Centro Cultural de Belém Shop'),
            category: 'shopping',
            description: en(
              'Design store inside the cultural center: ceramics, Portuguese cork goods, art books, and small-edition prints. Quieter alternative to the LX Factory.',
            ),
            coords: { latitude: 38.696, longitude: -9.2076 },
            image: u('photo-1481437156560-3205f6a55735', 400),
            images: [
              u('photo-1481437156560-3205f6a55735', 800),
              u('photo-1483985988355-763728e1935b', 800),
            ],
          },
          {
            slug: 'mar-doce',
            order: 3,
            name: en('Mar Doce'),
            category: 'restaurant',
            description: en(
              'Seafood-leaning lunch spot just across from the Discoveries Monument. Grilled sardines, arroz de marisco, and a couple of outdoor tables when the weather plays along.',
            ),
            coords: { latitude: 38.695, longitude: -9.21 },
            image: u('photo-1559339352-11d035aa65de', 400),
            images: [
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1414235077428-338989a2e8c0', 800),
            ],
          },
        ],
      },
      {
        slug: 'sintra',
        name: en('Sintra Day Trip'),
        meta: en('8h · €95'),
        image: u('photo-1581784368651-8916092072cf', 400),
        stops: [
          {
            slug: 'pena',
            order: 0,
            name: en('Pena Palace'),
            description: en(
              'A 19th-century romantic castle painted yellow and red, perched on the hilltops above Sintra.',
            ),
            coords: { latitude: 38.7876, longitude: -9.3905 },
            image: u('photo-1581784368651-8916092072cf', 400),
          },
          {
            slug: 'quinta',
            order: 1,
            name: en('Quinta da Regaleira'),
            description: en(
              'A mystical estate of grottoes, towers, and an initiation well spiraling deep underground.',
            ),
            coords: { latitude: 38.7965, longitude: -9.3962 },
            image: u('photo-1503853585905-d53f628e46ac', 400),
          },
        ],
      },
      {
        slug: 'cascais',
        name: en('Cascais Coast Drive'),
        meta: en('5h · €60'),
        image: u('photo-1503853585905-d53f628e46ac', 400),
        stops: [
          {
            slug: 'boca',
            order: 0,
            name: en('Boca do Inferno'),
            description: en(
              'Ocean cliffs where the Atlantic crashes into a collapsed cave arch.',
            ),
            coords: { latitude: 38.6917, longitude: -9.4283 },
            image: u('photo-1503853585905-d53f628e46ac', 400),
          },
          {
            slug: 'guincho',
            order: 1,
            name: en('Guincho Beach'),
            description: en(
              'Wild windswept beach beloved by surfers and kitesurfers, framed by the Sintra hills.',
            ),
            coords: { latitude: 38.7321, longitude: -9.4731 },
            image: u('photo-1469854523086-cc02fe5d8800', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'time-out',
        name: en('Time Out Market'),
        meta: en('Food hall · €€'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
        description: en(
          'Twenty-four kitchens curated by Time Out food critics inside the 19th-century Mercado da Ribeira. One bill, one big communal table, dozens of Lisbon chefs under a single iron roof. Best off-peak: arrive before 12:30 or after 9.',
        ),
        images: [
          u('photo-1414235077428-338989a2e8c0', 800),
          u('photo-1559339352-11d035aa65de', 800),
          u('photo-1551024709-8f23befc6f87', 800),
        ],
      },
      {
        slug: 'cervejaria',
        name: en('Cervejaria Ramiro'),
        meta: en('Seafood · €€€'),
        image: u('photo-1559339352-11d035aa65de', 400),
        description: en(
          'A Lisbon institution since 1956. Order by weight from the live tank — clams, prawns, percebes, lobster — chased with cold Sagres. Finish with the prego, a garlicky steak sandwich.',
        ),
        images: [
          u('photo-1559339352-11d035aa65de', 800),
          u('photo-1414235077428-338989a2e8c0', 800),
        ],
      },
    ],
    bars: [
      {
        slug: 'park',
        name: en('Park Bar'),
        meta: en('Rooftop · Cocktails'),
        image: u('photo-1551024709-8f23befc6f87', 400),
        description: en(
          'A rooftop bar hidden on top of a Bairro Alto parking garage. Take the lift to the top floor, climb one flight of stairs, and emerge into pine trees, fairy lights, and a sunset view across the river.',
        ),
        images: [
          u('photo-1551024709-8f23befc6f87', 800),
          u('photo-1470337458703-46ad1756a187', 800),
          u('photo-1514362545857-3bc16c4c7d1b', 800),
        ],
      },
      {
        slug: 'pensao',
        name: en('Pensão Amor'),
        meta: en('Cabaret · Late'),
        image: u('photo-1470337458703-46ad1756a187', 400),
        description: en(
          'A former pensão (boarding house) turned baroque bar and burlesque venue down by Cais do Sodré. Velvet, gilt, plush sofas, cocktails strong enough to remember and weak enough to repeat.',
        ),
        images: [
          u('photo-1470337458703-46ad1756a187', 800),
          u('photo-1551024709-8f23befc6f87', 800),
        ],
      },
    ],
    shopping: [
      {
        slug: 'embaixada',
        name: en('Embaixada'),
        meta: en('Concept store'),
        image: u('photo-1481437156560-3205f6a55735', 400),
        description: en(
          'A 19th-century neo-Moorish palace in Príncipe Real reborn as a multi-brand concept gallery. Independent Portuguese designers, ceramics, fragrance, jewellery, and a courtyard café for between-floors espressos.',
        ),
        images: [
          u('photo-1481437156560-3205f6a55735', 800),
          u('photo-1483985988355-763728e1935b', 800),
        ],
      },
      {
        slug: 'feira',
        name: en('Feira da Ladra'),
        meta: en('Flea market · Tue/Sat'),
        image: u('photo-1483985988355-763728e1935b', 400),
        description: en(
          'Lisbon’s oldest flea market, spread across Campo de Santa Clara behind São Vicente. Tiles, azulejos, old maps, vinyl, soldered tin lanterns. Bring small bills, haggle politely, get there before noon.',
        ),
        images: [
          u('photo-1483985988355-763728e1935b', 800),
          u('photo-1481437156560-3205f6a55735', 800),
        ],
      },
    ],
  },
  {
    slug: 'kyoto',
    image: u('photo-1493780474015-ba834fd0ce2f'),
    name: { en: 'Kyoto', de: 'Kyōto', hr: 'Kyoto' },
    country: { en: 'Japan', de: 'Japan', hr: 'Japan' },
    editorPick: {
      headline: {
        en: 'Seasonal favorite',
        de: 'Saison-Favorit',
        hr: 'Sezonski favorit',
      },
      tagline: {
        en: 'Cherry blossoms in April, blazing maples in late November.',
        de: 'Kirschblüten im April, leuchtende Ahornbäume Ende November.',
        hr: 'Trešnjini cvjetovi u travnju, plameni javori krajem studenog.',
      },
    },
    excursions: [
      {
        slug: 'fushimi',
        name: en('Fushimi Inari Trail'),
        meta: en('4h · Free'),
        image: u('photo-1528360983277-13d401cdc186', 400),
        stops: [
          {
            slug: 'romon',
            order: 0,
            name: en('Rōmon Gate'),
            description: en(
              'The vermillion entrance gate to Fushimi Inari Taisha, donated in 1589.',
            ),
            coords: { latitude: 34.9671, longitude: 135.7727 },
            image: u('photo-1528360983277-13d401cdc186', 400),
          },
          {
            slug: 'senbon',
            order: 1,
            name: en('Senbon Torii'),
            description: en(
              'A tunnel of thousands of orange torii gates climbing the mountainside.',
            ),
            coords: { latitude: 34.9683, longitude: 135.779 },
            image: u('photo-1528360983277-13d401cdc186', 400),
          },
          {
            slug: 'yotsutsuji',
            order: 2,
            name: en('Yotsutsuji Intersection'),
            description: en('A halfway viewpoint over the city of Kyoto.'),
            coords: { latitude: 34.971, longitude: 135.7805 },
            image: u('photo-1517248135467-4c7edcad34c4', 400),
          },
        ],
      },
      {
        slug: 'arashiyama',
        name: en('Arashiyama Bamboo'),
        meta: en('Half day · ¥0'),
        image: u('photo-1528360983277-13d401cdc186', 400),
        stops: [
          {
            slug: 'togetsukyo',
            order: 0,
            name: en('Togetsukyo Bridge'),
            description: en(
              'The wooden moon-crossing bridge over the Katsura River.',
            ),
            coords: { latitude: 35.0131, longitude: 135.6779 },
            image: u('photo-1528360983277-13d401cdc186', 400),
          },
          {
            slug: 'bamboo',
            order: 1,
            name: en('Bamboo Grove'),
            description: en(
              'A path through towering bamboo that sings when the wind picks up.',
            ),
            coords: { latitude: 35.017, longitude: 135.672 },
            image: u('photo-1517248135467-4c7edcad34c4', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'gion',
        name: en('Gion Karyo'),
        meta: en('Kaiseki · ¥¥¥'),
        image: u('photo-1517248135467-4c7edcad34c4', 400),
      },
      {
        slug: 'nishiki',
        name: en('Nishiki Market Stalls'),
        meta: en('Street food · ¥'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'bee-house',
        name: en('Bee House'),
        meta: en('Speakeasy · Whisky'),
        image: u('photo-1514362545857-3bc16c4c7d1b', 400),
      },
    ],
    shopping: [
      {
        slug: 'sou-sou',
        name: en('SOU·SOU'),
        meta: en('Textiles · Tabi'),
        image: u('photo-1481437156560-3205f6a55735', 400),
      },
    ],
  },
  {
    slug: 'marrakech',
    image: u('photo-1517457373958-b7bdd4587205'),
    name: { en: 'Marrakech', de: 'Marrakesch', hr: 'Marakeš' },
    country: { en: 'Morocco', de: 'Marokko', hr: 'Maroko' },
    editorPick: {
      headline: {
        en: "Editor's pick",
        de: 'Empfehlung der Redaktion',
        hr: 'Izbor urednika',
      },
      tagline: {
        en: 'Souks, riads, and rooftop sunsets best enjoyed in March or October.',
        de: 'Souks, Riads und Sonnenuntergänge auf Dächern — am besten im März oder Oktober.',
        hr: 'Sukovi, riadi i zalasci sunca na krovovima — najljepši u ožujku ili listopadu.',
      },
    },
    excursions: [
      {
        slug: 'medina',
        name: en('Medina Walking Tour'),
        meta: en('4h · €30'),
        image: u('photo-1517457373958-b7bdd4587205', 400),
        stops: [
          {
            slug: 'jemaa',
            order: 0,
            name: en('Jemaa el-Fna'),
            description: en(
              'The pulse of the medina — storytellers, snake charmers, food stalls at night.',
            ),
            coords: { latitude: 31.6258, longitude: -7.9892 },
            image: u('photo-1517457373958-b7bdd4587205', 400),
          },
          {
            slug: 'koutoubia',
            order: 1,
            name: en('Koutoubia Mosque'),
            description: en(
              'The 12th-century minaret visible from across the medina.',
            ),
            coords: { latitude: 31.6242, longitude: -7.9929 },
            image: u('photo-1517457373958-b7bdd4587205', 400),
          },
          {
            slug: 'souks-stop',
            order: 2,
            name: en('Souk Semmarine'),
            description: en('A labyrinth of lanterns, spices, leather, and textiles.'),
            coords: { latitude: 31.6304, longitude: -7.987 },
            image: u('photo-1483985988355-763728e1935b', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'nomad',
        name: en('Nomad'),
        meta: en('Modern Moroccan · €€'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'barometre',
        name: en('Baromètre'),
        meta: en('Mixology · Hidden'),
        image: u('photo-1551024709-8f23befc6f87', 400),
      },
    ],
    shopping: [
      {
        slug: 'souks',
        name: en('Medina Souks'),
        meta: en('Spices · Leather · Rugs'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
  {
    slug: 'istanbul',
    image: u('photo-1524231757912-21f4fe3a7200'),
    name: { en: 'Istanbul', de: 'Istanbul', hr: 'Istanbul' },
    country: { en: 'Türkiye', de: 'Türkei', hr: 'Turska' },
    editorPick: {
      headline: {
        en: 'Crossroads classic',
        de: 'Klassiker an der Schnittstelle',
        hr: 'Klasik na razmeđu',
      },
      tagline: {
        en: 'Two continents, a Bosphorus ferry, and centuries of bazaar in a weekend.',
        de: 'Zwei Kontinente, eine Bosporus-Fähre und Jahrhunderte Basar an einem Wochenende.',
        hr: 'Dva kontinenta, trajekt preko Bospora i stoljeća bazara u jednom vikendu.',
      },
    },
    excursions: [
      {
        slug: 'sultanahmet',
        name: en('Sultanahmet Heritage Walk'),
        meta: en('3h · ₺400'),
        image: u('photo-1564507592333-c60657eea523', 400),
        stops: [
          {
            slug: 'hagia',
            order: 0,
            name: en('Hagia Sophia'),
            description: en(
              'Cathedral, mosque, museum, mosque again — fifteen centuries in one dome.',
            ),
            coords: { latitude: 41.0086, longitude: 28.9802 },
            image: u('photo-1564507592333-c60657eea523', 400),
          },
          {
            slug: 'blue-mosque',
            order: 1,
            name: en('Blue Mosque'),
            description: en('Six minarets and twenty thousand Iznik tiles.'),
            coords: { latitude: 41.0054, longitude: 28.9768 },
            image: u('photo-1541432901042-2d8bd64b4a9b', 400),
          },
          {
            slug: 'cistern',
            order: 2,
            name: en('Basilica Cistern'),
            description: en(
              'A subterranean forest of columns from Justinian’s reign.',
            ),
            coords: { latitude: 41.0084, longitude: 28.9779 },
            image: u('photo-1483985988355-763728e1935b', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'mikla',
        name: en('Mikla'),
        meta: en('New Anatolian · ₺₺₺'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: '360',
        name: en('360 Istanbul'),
        meta: en('Rooftop · Cocktails'),
        image: u('photo-1551024709-8f23befc6f87', 400),
      },
    ],
    shopping: [
      {
        slug: 'grand-bazaar',
        name: en('Grand Bazaar'),
        meta: en('Carpets · Lanterns'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
  {
    slug: 'reykjavik',
    image: u('photo-1531168556467-80aace0d0144'),
    name: { en: 'Reykjavík', de: 'Reykjavík', hr: 'Reykjavík' },
    country: { en: 'Iceland', de: 'Island', hr: 'Island' },
    editorPick: {
      headline: {
        en: 'Northern lights',
        de: 'Nordlichter',
        hr: 'Polarna svjetlost',
      },
      tagline: {
        en: 'Late September through March for dark skies and quiet geothermal pools.',
        de: 'Ende September bis März für dunkle Himmel und ruhige Thermalbäder.',
        hr: 'Od kraja rujna do ožujka — tamno nebo i mirni geotermalni bazeni.',
      },
    },
    excursions: [
      {
        slug: 'downtown',
        name: en('Old Town Stroll'),
        meta: en('2h · Free'),
        image: u('photo-1531168556467-80aace0d0144', 400),
        stops: [
          {
            slug: 'hallgrim',
            order: 0,
            name: en('Hallgrímskirkja'),
            description: en('A basalt-inspired church rising 74 m over the city.'),
            coords: { latitude: 64.1418, longitude: -21.9266 },
            image: u('photo-1531168556467-80aace0d0144', 400),
          },
          {
            slug: 'harpa',
            order: 1,
            name: en('Harpa Concert Hall'),
            description: en('A glittering basalt-glass facade on the harbor.'),
            coords: { latitude: 64.1503, longitude: -21.9326 },
            image: u('photo-1500039436846-25ae2f11882e', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'dill',
        name: en('Dill'),
        meta: en('New Nordic · €€€'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'kaldi',
        name: en('Kaldi Bar'),
        meta: en('Local brews'),
        image: u('photo-1514362545857-3bc16c4c7d1b', 400),
      },
    ],
    shopping: [
      {
        slug: 'kolaportid',
        name: en('Kolaportið Flea'),
        meta: en('Weekend market'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
  {
    slug: 'cape-town',
    image: u('photo-1576487248805-cf45f6bcc67f'),
    name: { en: 'Cape Town', de: 'Kapstadt', hr: 'Cape Town' },
    country: {
      en: 'South Africa',
      de: 'Südafrika',
      hr: 'Južnoafrička Republika',
    },
    editorPick: {
      headline: {
        en: "Editor's pick",
        de: 'Empfehlung der Redaktion',
        hr: 'Izbor urednika',
      },
      tagline: {
        en: 'Table Mountain mornings, wine-country afternoons, ocean cliffs at dusk.',
        de: 'Tafelberg am Morgen, Weinland am Nachmittag, Klippen bei Sonnenuntergang.',
        hr: 'Jutra na Stolnoj gori, popodneva u vinogradima, stijene nad oceanom u suton.',
      },
    },
    excursions: [
      {
        slug: 'cbd',
        name: en('City Bowl Walk'),
        meta: en('3h · R250'),
        image: u('photo-1580060839134-75a5edca2e99', 400),
        stops: [
          {
            slug: 'company',
            order: 0,
            name: en('Company’s Garden'),
            description: en(
              'The 17th-century VOC vegetable plot turned shady park.',
            ),
            coords: { latitude: -33.9286, longitude: 18.4146 },
            image: u('photo-1469854523086-cc02fe5d8800', 400),
          },
          {
            slug: 'bo-kaap',
            order: 1,
            name: en('Bo-Kaap'),
            description: en(
              'Cobbled streets of brightly painted Cape Malay houses.',
            ),
            coords: { latitude: -33.9211, longitude: 18.4112 },
            image: u('photo-1580060839134-75a5edca2e99', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'pot-luck',
        name: en('The Pot Luck Club'),
        meta: en('Tapas · R$$'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'orphanage',
        name: en('The Orphanage'),
        meta: en('Cocktails · Cellar'),
        image: u('photo-1551024709-8f23befc6f87', 400),
      },
    ],
    shopping: [
      {
        slug: 'old-biscuit',
        name: en('Old Biscuit Mill'),
        meta: en('Saturday market'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
  {
    slug: 'rio',
    image: u('photo-1483729558449-99ef09a8c325'),
    name: {
      en: 'Rio de Janeiro',
      de: 'Rio de Janeiro',
      hr: 'Rio de Janeiro',
    },
    country: { en: 'Brazil', de: 'Brasilien', hr: 'Brazil' },
    editorPick: {
      headline: {
        en: 'Carnival ready',
        de: 'Bereit für den Karneval',
        hr: 'Spreman za karneval',
      },
      tagline: {
        en: 'Plan around February for street parades, samba schools, and beach culture.',
        de: 'Plane für Februar: Straßenumzüge, Sambaschulen und Strandkultur.',
        hr: 'Planiraj veljaču — ulične povorke, samba škole i kultura plaže.',
      },
    },
    excursions: [
      {
        slug: 'corcovado',
        name: en('Corcovado & Christ'),
        meta: en('4h · R$120'),
        image: u('photo-1483729558449-99ef09a8c325', 400),
        stops: [
          {
            slug: 'cristo',
            order: 0,
            name: en('Cristo Redentor'),
            description: en(
              'The 38 m art-deco Christ overlooking the city from Corcovado.',
            ),
            coords: { latitude: -22.9519, longitude: -43.2105 },
            image: u('photo-1483729558449-99ef09a8c325', 400),
          },
          {
            slug: 'tijuca',
            order: 1,
            name: en('Tijuca Forest View'),
            description: en(
              'A glimpse into the world’s largest urban rainforest.',
            ),
            coords: { latitude: -22.9606, longitude: -43.2786 },
            image: u('photo-1456428199391-a3b1cb5e93ab', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'aprazivel',
        name: en('Aprazível'),
        meta: en('Brazilian · R$$$'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'palaphita',
        name: en('Palaphita Kitch'),
        meta: en('Lagoon-side'),
        image: u('photo-1551024709-8f23befc6f87', 400),
      },
    ],
    shopping: [
      {
        slug: 'ipanema-fair',
        name: en('Ipanema Hippie Fair'),
        meta: en('Sundays · Art'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
  {
    slug: 'queenstown',
    image: u('photo-1469854523086-cc02fe5d8800'),
    name: { en: 'Queenstown', de: 'Queenstown', hr: 'Queenstown' },
    country: { en: 'New Zealand', de: 'Neuseeland', hr: 'Novi Zeland' },
    editorPick: {
      headline: {
        en: 'Adventure base',
        de: 'Basislager für Abenteuer',
        hr: 'Baza za avanturu',
      },
      tagline: {
        en: 'Skiing in July, fjord hikes in February — alpine drama year-round.',
        de: 'Skifahren im Juli, Fjordwanderungen im Februar — alpine Dramatik das ganze Jahr.',
        hr: 'Skijanje u srpnju, ture po fjordovima u veljači — alpska drama tijekom cijele godine.',
      },
    },
    excursions: [
      {
        slug: 'lakeside',
        name: en('Lakeside Loop'),
        meta: en('2h · Free'),
        image: u('photo-1469854523086-cc02fe5d8800', 400),
        stops: [
          {
            slug: 'gardens',
            order: 0,
            name: en('Queenstown Gardens'),
            description: en(
              'A peninsula park on Lake Wakatipu with a disc-golf course and pine groves.',
            ),
            coords: { latitude: -45.0387, longitude: 168.6635 },
            image: u('photo-1469854523086-cc02fe5d8800', 400),
          },
          {
            slug: 'pier',
            order: 1,
            name: en('Steamer Wharf'),
            description: en(
              'Old jetty for the TSS Earnslaw, the lake’s 1912 coal-fired steamship.',
            ),
            coords: { latitude: -45.0318, longitude: 168.6573 },
            image: u('photo-1469474968028-56623f02e42e', 400),
          },
        ],
      },
    ],
    restaurants: [
      {
        slug: 'rata',
        name: en('Rātā'),
        meta: en('Modern NZ · NZ$$$'),
        image: u('photo-1414235077428-338989a2e8c0', 400),
      },
    ],
    bars: [
      {
        slug: 'little-blackwood',
        name: en('Little Blackwood'),
        meta: en('Whisky · Lakeside'),
        image: u('photo-1514362545857-3bc16c4c7d1b', 400),
      },
    ],
    shopping: [
      {
        slug: 'remarkables',
        name: en('Remarkables Market'),
        meta: en('Sat · Local makers'),
        image: u('photo-1483985988355-763728e1935b', 400),
      },
    ],
  },
];
