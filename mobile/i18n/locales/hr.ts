import type { Translations } from './en'

export const hr: Translations = {
  common: {
    tryAgain: 'Pokušaj ponovno',
    skip: 'Preskoči',
    somethingWentWrong: 'Nešto je pošlo po zlu',
    offline: 'Nema internetske veze',
  },
  tabs: {
    discover: 'Otkrij',
    favorites: 'Favoriti',
    profile: 'Profil',
  },
  discover: {
    searchPlaceholder: 'Pretraži gradove ili države',
    noResultsTitle: 'Nema rezultata',
    noResultsBody:
      'Nismo pronašli gradove koji odgovaraju „{{query}}". Pokušaj s drugim nazivom ili državom.',
    errorBody: 'Trenutno ne možemo učitati popis gradova.',
  },
  favorites: {
    emptyTitle: 'Još nemaš favorite',
    emptyBody:
      'Gradovi koje spremiš pojavit će se ovdje kako bi mogao planirati sljedeće putovanje.',
    signInRequiredTitle: 'Prijavi se kako bi spremio favorite',
    signInRequiredBody:
      'Za spremanje gradova, izleta i mjesta potreban je račun, kako bismo ih sinkronizirali na više uređaja.',
    errorBody: 'Trenutačno ne možemo učitati tvoje favorite.',
    sections: {
      cities: 'Gradovi',
      excursions: 'Izleti',
      places: 'Mjesta',
    },
  },
  profile: {
    guestName: 'Gost putnik',
    signInPrompt:
      'Prijavi se kako bi spremio gradove i ture sinkronizirao na više uređaja.',
    signIn: 'Prijava',
    signOut: 'Odjava',
    appearance: 'Izgled',
    language: 'Jezik',
    themeSystem: 'Sustav',
    themeLight: 'Svijetlo',
    themeDark: 'Tamno',
    languageSystem: 'Sustav',
  },
  auth: {
    titleA: 'Odavde',
    titleB: 'donde.',
    subtitle:
      'Prijavi se kako bi spremio favorite i sinkronizirao ih na više uređaja, ili nastavi kao gost.',
    continueWithGoogle: 'Nastavi s Googleom',
    continueWithApple: 'Nastavi s Appleom',
    skip: 'Nastavi bez prijave',
    signInFailedTitle: 'Prijava nije uspjela',
  },
  city: {
    notFound: 'Taj grad nismo uspjeli pronaći.',
    audioTitle: 'O ovom gradu',
    audioPrompt: 'Dodirni za reprodukciju',
    audioPlaying: 'Reproducira se…',
    sections: {
      excursions: 'Izleti',
      restaurants: 'Restorani',
      cafes: 'Kafići',
      pastries: 'Slastičarnice',
      brunches: 'Brunch',
      bars: 'Barovi',
      shopping: 'Kupovina',
      events: 'Događanja',
      museums: 'Muzeji',
      viewpoints: 'Vidikovci',
      parks: 'Parkovi',
      workshops: 'Radionice',
      playareas: 'Igraonice',
      locals: 'Lokalne preporuke',
    },
    subCategoryOther: 'Ostalo',
  },
  place: {
    notFound: 'To mjesto nismo uspjeli pronaći.',
    fallbackDescription:
      'Pažljivo odabrano mjesto vrijedno obilaska. Detalji i radno vrijeme uskoro stižu — za sada su dovoljni adresa i kategorija.',
    audioTitle: 'Audio vodič',
    audioPrompt: 'Dodirni za reprodukciju',
    audioPlaying: 'Reproducira se…',
    category: {
      restaurant: 'Restoran',
      cafe: 'Kafić',
      pastry: 'Slastičarnica',
      brunch: 'Brunch',
      bar: 'Bar',
      shopping: 'Kupovina',
      event: 'Događanje',
      park: 'Park',
      museum: 'Muzej',
      viewpoint: 'Vidikovac',
      local: 'Lokalna preporuka',
      workshop: 'Radionica',
      playarea: 'Igraonica',
    },
  },
  excursion: {
    notFound: 'Taj izlet nismo uspjeli pronaći.',
    waitingForGps: 'Čekam lokaciju…',
    farFromStop: 'Daleko od postaje',
    preview: {
      title: 'Spreman za istraživanje?',
      subtitle: '{{count}} postaja · vodimo te između njih.',
      start: 'Započni',
    },
    navigating: {
      stopOf: 'Postaja {{index}} od {{total}}',
    },
    arrived: {
      arrivedLabel: 'Stigao si · Postaja {{index}} od {{total}}',
      moreInfo: 'Više informacija',
      continue: 'Nastavi',
      finish: 'Završi',
      next: 'Sljedeće',
      bundleIntro: '{{count}} postaja na {{bundle}}',
      bundlePosition: '{{index}} od {{total}} · {{bundle}}',
      startStops: 'Započni {{count}} postaja',
      skipSubStop: 'Preskoči {{name}}',
      skipBundle: 'Preskoči sve postaje na {{bundle}}',
    },
    outro: {
      finish: 'Završi',
    },
    complete: {
      title: 'Tura završena',
      body: 'Posjetio si svih {{total}} postaja. Nadamo se da je vrijedilo.',
      done: 'Gotovo',
    },
    list: {
      current: 'Trenutno',
      bundleCount: '{{count}} postaja',
    },
    stopSheet: {
      audioTitle: 'Audio vodič',
      audioPrompt: 'Dodirni za reprodukciju',
      audioPlaying: 'Reproducira se…',
      audioMissing: 'Za ovu postaju još nema audio zapisa.',
      bundleHeader: '{{count}} postaja na ovom mjestu',
    },
    facts: {
      bannerLabel: 'Jeste li znali?',
    },
    startFrom: {
      label: 'Polazna točka',
      pickerTitle: 'Odaberi polaznu točku',
      nearestBadge: 'Najbliža',
    },
    undoSkip: {
      title: 'Dodirni za poništavanje',
    },
    locationDenied: {
      title: 'Potrebna je lokacija',
      body: 'Ovom izletu treba tvoja lokacija za navigaciju između postaja. Uključi je u Postavkama za nastavak.',
      cta: 'Otvori Postavke',
      goBack: 'Natrag',
    },
    offRoute: {
      title: 'Skrenuo si s rute',
      cta: 'Dodirni za ponovni izračun',
    },
    farFromRoute: {
      title: 'Daleko si od ovog izleta',
      body: 'Najbliža postaja je oko {{km}} km daleko.',
      startAnyway: 'Ipak započni',
    },
  },
}
