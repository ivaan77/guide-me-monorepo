export type EditorPick = {
  headline: string
  tagline: string
}

export type CategoryItem = {
  id: string
  name: string
  meta: string
  image: string
}

export type LatLng = {
  latitude: number
  longitude: number
}

export type ExcursionStop = {
  id: string
  order: number
  name: string
  description: string
  coords: LatLng
  image: string
  images?: string[]
  audioUrl?: string
}

export type PoiCategory = 'restaurant' | 'bar' | 'shopping'

export type Poi = {
  id: string
  order: number
  name: string
  category: PoiCategory
  description: string
  coords: LatLng
  image: string
  images?: string[]
}

export type Excursion = CategoryItem & {
  stops: ExcursionStop[]
  pois?: Poi[]
}

export type City = {
  id: string
  name: string
  country: string
  image: string
  editorPick?: EditorPick
  excursions?: Excursion[]
  restaurants?: CategoryItem[]
  bars?: CategoryItem[]
  shopping?: CategoryItem[]
}

const FAKE_LATENCY_MS = 900
const FAKE_FAILURE_RATE = 0

export async function fetchCities(): Promise<City[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS))
  if (Math.random() < FAKE_FAILURE_RATE) {
    throw new Error('Failed to load cities')
  }
  return cities
}

export function getCityById(id: string): City | undefined {
  return cities.find((city) => city.id === id)
}

export function getExcursionById(id: string): { excursion: Excursion; city: City } | undefined {
  for (const city of cities) {
    const excursion = city.excursions?.find((e) => e.id === id)
    if (excursion) return { excursion, city }
  }
  return undefined
}

const u = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const cities: City[] = [
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    image: u('photo-1513735492246-483525079686', 900),
    editorPick: {
      headline: "Editor's pick",
      tagline: 'Best in spring for sunlit miradouros and fado-lit nights.',
    },
    excursions: [
      {
        id: 'belem',
        name: 'Belém Tower Walk',
        meta: '3h · €35',
        image: u('photo-1555881400-74d7acaacd8b'),
        stops: [
          {
            id: 'jeronimos',
            order: 0,
            name: 'Jerónimos Monastery',
            description:
              'A UNESCO-listed cloister in white limestone, built to celebrate Vasco da Gama’s return from India. Construction began in 1501 under King Manuel I and continued for nearly a century, blending late-Gothic structure with the Manueline ornament that became Portugal’s signature style. Vasco da Gama, Luís de Camões, and Fernando Pessoa are all buried inside. Plan at least an hour for the church and cloister; arrive early in the day to beat the cruise-ship crowds.',
            coords: { latitude: 38.6979, longitude: -9.2068 },
            image: u('photo-1513735492246-483525079686'),
            images: [
              u('photo-1513735492246-483525079686', 800),
              u('photo-1555881400-74d7acaacd8b', 800),
              u('photo-1503853585905-d53f628e46ac', 800),
              u('photo-1483985988355-763728e1935b', 800),
            ],
          },
          {
            id: 'pasteis',
            order: 2,
            name: 'Pastéis de Belém',
            description:
              'The original 1837 bakery for Portugal’s iconic custard tart. The recipe is a closely guarded secret known only to a handful of bakers, passed down through five generations. Lines move quickly — head straight in, order at the counter, and grab a marble-topped table inside. Eat one warm with cinnamon and powdered sugar on top, paired with a bica (Lisbon espresso).',
            coords: { latitude: 38.6975, longitude: -9.2032 },
            image: u('photo-1567306226416-28f0efdc88ce'),
            images: [
              u('photo-1567306226416-28f0efdc88ce', 800),
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1414235077428-338989a2e8c0', 800),
            ],
          },
          {
            id: 'belem-tower',
            order: 6,
            name: 'Belém Tower',
            description:
              'A fortified Manueline lighthouse on the Tagus, completed in 1519 as the symbolic last sight of Lisbon for sailors heading to the New World. Carved sea ropes and twists in limestone, defensive balconies overlooking the river, and a rooftop terrace with sweeping views of the estuary. The narrow spiral staircase is one-way with timed entries — book online to skip the line.',
            coords: { latitude: 38.69175, longitude: -9.21595 },
            image: u('photo-1555881400-74d7acaacd8b'),
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
            id: 'darwin-cafe',
            order: 4,
            name: "Darwin's Café",
            category: 'restaurant',
            description:
              "Modern bistro hidden inside the Champalimaud Centre, with floor-to-ceiling windows over the Tagus. Lunch menu rotates weekly; the polvo (octopus) is a quiet local favorite.",
            coords: { latitude: 38.6932, longitude: -9.2173 },
            image: u('photo-1414235077428-338989a2e8c0'),
            images: [
              u('photo-1414235077428-338989a2e8c0', 800),
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1551024709-8f23befc6f87', 800),
            ],
          },
          {
            id: 'enoteca-belem',
            order: 1,
            name: 'Enoteca de Belém',
            category: 'bar',
            description:
              'Tiny corner wine bar a block off Rua de Belém. Iberian cheese boards, a focused Portuguese wine list, and conversation-friendly noise. Best at golden hour.',
            coords: { latitude: 38.6973, longitude: -9.2045 },
            image: u('photo-1551024709-8f23befc6f87'),
            images: [
              u('photo-1551024709-8f23befc6f87', 800),
              u('photo-1514362545857-3bc16c4c7d1b', 800),
              u('photo-1470337458703-46ad1756a187', 800),
            ],
          },
          {
            id: 'centro-cultural',
            order: 5,
            name: 'Centro Cultural de Belém Shop',
            category: 'shopping',
            description:
              "Design store inside the cultural center: ceramics, Portuguese cork goods, art books, and small-edition prints. Quieter alternative to the LX Factory.",
            coords: { latitude: 38.6960, longitude: -9.2076 },
            image: u('photo-1481437156560-3205f6a55735'),
            images: [
              u('photo-1481437156560-3205f6a55735', 800),
              u('photo-1483985988355-763728e1935b', 800),
            ],
          },
          {
            id: 'mar-doce',
            order: 3,
            name: 'Mar Doce',
            category: 'restaurant',
            description:
              "Seafood-leaning lunch spot just across from the Discoveries Monument. Grilled sardines, arroz de marisco, and a couple of outdoor tables when the weather plays along.",
            coords: { latitude: 38.6950, longitude: -9.2100 },
            image: u('photo-1559339352-11d035aa65de'),
            images: [
              u('photo-1559339352-11d035aa65de', 800),
              u('photo-1414235077428-338989a2e8c0', 800),
            ],
          },
        ],
      },
      {
        id: 'sintra',
        name: 'Sintra Day Trip',
        meta: '8h · €95',
        image: u('photo-1581784368651-8916092072cf'),
        stops: [
          {
            id: 'pena',
            order: 0,
            name: 'Pena Palace',
            description:
              'A 19th-century romantic castle painted yellow and red, perched on the hilltops above Sintra.',
            coords: { latitude: 38.7876, longitude: -9.3905 },
            image: u('photo-1581784368651-8916092072cf'),
          },
          {
            id: 'quinta',
            order: 1,
            name: 'Quinta da Regaleira',
            description:
              'A mystical estate of grottoes, towers, and an initiation well spiraling deep underground.',
            coords: { latitude: 38.7965, longitude: -9.3962 },
            image: u('photo-1503853585905-d53f628e46ac'),
          },
        ],
      },
      {
        id: 'cascais',
        name: 'Cascais Coast Drive',
        meta: '5h · €60',
        image: u('photo-1503853585905-d53f628e46ac'),
        stops: [
          {
            id: 'boca',
            order: 0,
            name: 'Boca do Inferno',
            description: 'Ocean cliffs where the Atlantic crashes into a collapsed cave arch.',
            coords: { latitude: 38.6917, longitude: -9.4283 },
            image: u('photo-1503853585905-d53f628e46ac'),
          },
          {
            id: 'guincho',
            order: 1,
            name: 'Guincho Beach',
            description: 'Wild windswept beach beloved by surfers and kitesurfers, framed by the Sintra hills.',
            coords: { latitude: 38.7321, longitude: -9.4731 },
            image: u('photo-1469854523086-cc02fe5d8800'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'time-out', name: 'Time Out Market', meta: 'Food hall · €€', image: u('photo-1414235077428-338989a2e8c0') },
      { id: 'cervejaria', name: 'Cervejaria Ramiro', meta: 'Seafood · €€€', image: u('photo-1559339352-11d035aa65de') },
    ],
    bars: [
      { id: 'park', name: 'Park Bar', meta: 'Rooftop · Cocktails', image: u('photo-1551024709-8f23befc6f87') },
      { id: 'pensao', name: 'Pensão Amor', meta: 'Cabaret · Late', image: u('photo-1470337458703-46ad1756a187') },
    ],
    shopping: [
      { id: 'embaixada', name: 'Embaixada', meta: 'Concept store', image: u('photo-1481437156560-3205f6a55735') },
      { id: 'feira', name: 'Feira da Ladra', meta: 'Flea market · Tue/Sat', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    image: u('photo-1493780474015-ba834fd0ce2f', 900),
    editorPick: {
      headline: 'Seasonal favorite',
      tagline: 'Cherry blossoms in April, blazing maples in late November.',
    },
    excursions: [
      {
        id: 'fushimi',
        name: 'Fushimi Inari Trail',
        meta: '4h · Free',
        image: u('photo-1528360983277-13d401cdc186'),
        stops: [
          {
            id: 'romon',
            order: 0,
            name: 'Rōmon Gate',
            description: 'The vermillion entrance gate to Fushimi Inari Taisha, donated in 1589.',
            coords: { latitude: 34.9671, longitude: 135.7727 },
            image: u('photo-1528360983277-13d401cdc186'),
          },
          {
            id: 'senbon',
            order: 1,
            name: 'Senbon Torii',
            description: 'A tunnel of thousands of orange torii gates climbing the mountainside.',
            coords: { latitude: 34.9683, longitude: 135.7790 },
            image: u('photo-1528360983277-13d401cdc186'),
          },
          {
            id: 'yotsutsuji',
            order: 2,
            name: 'Yotsutsuji Intersection',
            description: 'A halfway viewpoint over the city of Kyoto.',
            coords: { latitude: 34.9710, longitude: 135.7805 },
            image: u('photo-1517248135467-4c7edcad34c4'),
          },
        ],
      },
      {
        id: 'arashiyama',
        name: 'Arashiyama Bamboo',
        meta: 'Half day · ¥0',
        image: u('photo-1528360983277-13d401cdc186'),
        stops: [
          {
            id: 'togetsukyo',
            order: 0,
            name: 'Togetsukyo Bridge',
            description: 'The wooden moon-crossing bridge over the Katsura River.',
            coords: { latitude: 35.0131, longitude: 135.6779 },
            image: u('photo-1528360983277-13d401cdc186'),
          },
          {
            id: 'bamboo',
            order: 1,
            name: 'Bamboo Grove',
            description: 'A path through towering bamboo that sings when the wind picks up.',
            coords: { latitude: 35.0170, longitude: 135.6720 },
            image: u('photo-1517248135467-4c7edcad34c4'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'gion', name: 'Gion Karyo', meta: 'Kaiseki · ¥¥¥', image: u('photo-1517248135467-4c7edcad34c4') },
      { id: 'nishiki', name: 'Nishiki Market Stalls', meta: 'Street food · ¥', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'bee-house', name: 'Bee House', meta: 'Speakeasy · Whisky', image: u('photo-1514362545857-3bc16c4c7d1b') },
    ],
    shopping: [
      { id: 'sou-sou', name: 'SOU·SOU', meta: 'Textiles · Tabi', image: u('photo-1481437156560-3205f6a55735') },
    ],
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Morocco',
    image: u('photo-1517457373958-b7bdd4587205', 900),
    editorPick: {
      headline: "Editor's pick",
      tagline: 'Souks, riads, and rooftop sunsets best enjoyed in March or October.',
    },
    excursions: [
      {
        id: 'medina',
        name: 'Medina Walking Tour',
        meta: '4h · €30',
        image: u('photo-1517457373958-b7bdd4587205'),
        stops: [
          {
            id: 'jemaa',
            order: 0,
            name: 'Jemaa el-Fna',
            description: 'The pulse of the medina — storytellers, snake charmers, food stalls at night.',
            coords: { latitude: 31.6258, longitude: -7.9892 },
            image: u('photo-1517457373958-b7bdd4587205'),
          },
          {
            id: 'koutoubia',
            order: 1,
            name: 'Koutoubia Mosque',
            description: 'The 12th-century minaret visible from across the medina.',
            coords: { latitude: 31.6242, longitude: -7.9929 },
            image: u('photo-1517457373958-b7bdd4587205'),
          },
          {
            id: 'souks-stop',
            order: 2,
            name: 'Souk Semmarine',
            description: 'A labyrinth of lanterns, spices, leather, and textiles.',
            coords: { latitude: 31.6304, longitude: -7.9870 },
            image: u('photo-1483985988355-763728e1935b'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'nomad', name: 'Nomad', meta: 'Modern Moroccan · €€', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'barometre', name: 'Baromètre', meta: 'Mixology · Hidden', image: u('photo-1551024709-8f23befc6f87') },
    ],
    shopping: [
      { id: 'souks', name: 'Medina Souks', meta: 'Spices · Leather · Rugs', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Türkiye',
    image: u('photo-1524231757912-21f4fe3a7200', 900),
    editorPick: {
      headline: 'Crossroads classic',
      tagline: 'Two continents, a Bosphorus ferry, and centuries of bazaar in a weekend.',
    },
    excursions: [
      {
        id: 'sultanahmet',
        name: 'Sultanahmet Heritage Walk',
        meta: '3h · ₺400',
        image: u('photo-1564507592333-c60657eea523'),
        stops: [
          {
            id: 'hagia',
            order: 0,
            name: 'Hagia Sophia',
            description: 'Cathedral, mosque, museum, mosque again — fifteen centuries in one dome.',
            coords: { latitude: 41.0086, longitude: 28.9802 },
            image: u('photo-1564507592333-c60657eea523'),
          },
          {
            id: 'blue-mosque',
            order: 1,
            name: 'Blue Mosque',
            description: 'Six minarets and twenty thousand Iznik tiles.',
            coords: { latitude: 41.0054, longitude: 28.9768 },
            image: u('photo-1541432901042-2d8bd64b4a9b'),
          },
          {
            id: 'cistern',
            order: 2,
            name: 'Basilica Cistern',
            description: 'A subterranean forest of columns from Justinian’s reign.',
            coords: { latitude: 41.0084, longitude: 28.9779 },
            image: u('photo-1483985988355-763728e1935b'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'mikla', name: 'Mikla', meta: 'New Anatolian · ₺₺₺', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: '360', name: '360 Istanbul', meta: 'Rooftop · Cocktails', image: u('photo-1551024709-8f23befc6f87') },
    ],
    shopping: [
      { id: 'grand-bazaar', name: 'Grand Bazaar', meta: 'Carpets · Lanterns', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    country: 'Iceland',
    image: u('photo-1531168556467-80aace0d0144', 900),
    editorPick: {
      headline: 'Northern lights',
      tagline: 'Late September through March for dark skies and quiet geothermal pools.',
    },
    excursions: [
      {
        id: 'downtown',
        name: 'Old Town Stroll',
        meta: '2h · Free',
        image: u('photo-1531168556467-80aace0d0144'),
        stops: [
          {
            id: 'hallgrim',
            order: 0,
            name: 'Hallgrímskirkja',
            description: 'A basalt-inspired church rising 74 m over the city.',
            coords: { latitude: 64.1418, longitude: -21.9266 },
            image: u('photo-1531168556467-80aace0d0144'),
          },
          {
            id: 'harpa',
            order: 1,
            name: 'Harpa Concert Hall',
            description: 'A glittering basalt-glass facade on the harbor.',
            coords: { latitude: 64.1503, longitude: -21.9326 },
            image: u('photo-1500039436846-25ae2f11882e'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'dill', name: 'Dill', meta: 'New Nordic · €€€', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'kaldi', name: 'Kaldi Bar', meta: 'Local brews', image: u('photo-1514362545857-3bc16c4c7d1b') },
    ],
    shopping: [
      { id: 'kolaportid', name: 'Kolaportið Flea', meta: 'Weekend market', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    image: u('photo-1576487248805-cf45f6bcc67f', 900),
    editorPick: {
      headline: "Editor's pick",
      tagline: 'Table Mountain mornings, wine-country afternoons, ocean cliffs at dusk.',
    },
    excursions: [
      {
        id: 'cbd',
        name: 'City Bowl Walk',
        meta: '3h · R250',
        image: u('photo-1580060839134-75a5edca2e99'),
        stops: [
          {
            id: 'company',
            order: 0,
            name: 'Company’s Garden',
            description: 'The 17th-century VOC vegetable plot turned shady park.',
            coords: { latitude: -33.9286, longitude: 18.4146 },
            image: u('photo-1469854523086-cc02fe5d8800'),
          },
          {
            id: 'bo-kaap',
            order: 1,
            name: 'Bo-Kaap',
            description: 'Cobbled streets of brightly painted Cape Malay houses.',
            coords: { latitude: -33.9211, longitude: 18.4112 },
            image: u('photo-1580060839134-75a5edca2e99'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'pot-luck', name: 'The Pot Luck Club', meta: 'Tapas · R$$', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'orphanage', name: 'The Orphanage', meta: 'Cocktails · Cellar', image: u('photo-1551024709-8f23befc6f87') },
    ],
    shopping: [
      { id: 'old-biscuit', name: 'Old Biscuit Mill', meta: 'Saturday market', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    image: u('photo-1483729558449-99ef09a8c325', 900),
    editorPick: {
      headline: 'Carnival ready',
      tagline: 'Plan around February for street parades, samba schools, and beach culture.',
    },
    excursions: [
      {
        id: 'corcovado',
        name: 'Corcovado & Christ',
        meta: '4h · R$120',
        image: u('photo-1483729558449-99ef09a8c325'),
        stops: [
          {
            id: 'cristo',
            order: 0,
            name: 'Cristo Redentor',
            description: 'The 38 m art-deco Christ overlooking the city from Corcovado.',
            coords: { latitude: -22.9519, longitude: -43.2105 },
            image: u('photo-1483729558449-99ef09a8c325'),
          },
          {
            id: 'tijuca',
            order: 1,
            name: 'Tijuca Forest View',
            description: 'A glimpse into the world’s largest urban rainforest.',
            coords: { latitude: -22.9606, longitude: -43.2786 },
            image: u('photo-1456428199391-a3b1cb5e93ab'),
          },
        ],
      },
    ],
    restaurants: [
      { id: 'aprazivel', name: 'Aprazível', meta: 'Brazilian · R$$$', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'palaphita', name: 'Palaphita Kitch', meta: 'Lagoon-side', image: u('photo-1551024709-8f23befc6f87') },
    ],
    shopping: [
      { id: 'ipanema-fair', name: 'Ipanema Hippie Fair', meta: 'Sundays · Art', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    country: 'New Zealand',
    image: u('photo-1469854523086-cc02fe5d8800', 900),
    editorPick: {
      headline: 'Adventure base',
      tagline: 'Skiing in July, fjord hikes in February — alpine drama year-round.',
    },
    excursions: [
      {
        id: 'lakeside',
        name: 'Lakeside Loop',
        meta: '2h · Free',
        image: u('photo-1469854523086-cc02fe5d8800'),
        stops: [
          {
            id: 'gardens',
            order: 0,
            name: 'Queenstown Gardens',
            description: 'A peninsula park on Lake Wakatipu with a disc-golf course and pine groves.',
            coords: { latitude: -45.0387, longitude: 168.6635 },
            image: u('photo-1469854523086-cc02fe5d8800'),
          },
          {
            id: 'pier',
            order: 1,
            name: 'Steamer Wharf',
            description: 'Old jetty for the TSS Earnslaw, the lake’s 1912 coal-fired steamship.',
            coords: { latitude: -45.0318, longitude: 168.6573 },
            image: u('photo-1469474968028-56623f02e42e') },
        ],
      },
    ],
    restaurants: [
      { id: 'rata', name: 'Rātā', meta: 'Modern NZ · NZ$$$', image: u('photo-1414235077428-338989a2e8c0') },
    ],
    bars: [
      { id: 'little-blackwood', name: 'Little Blackwood', meta: 'Whisky · Lakeside', image: u('photo-1514362545857-3bc16c4c7d1b') },
    ],
    shopping: [
      { id: 'remarkables', name: 'Remarkables Market', meta: 'Sat · Local makers', image: u('photo-1483985988355-763728e1935b') },
    ],
  },
]
