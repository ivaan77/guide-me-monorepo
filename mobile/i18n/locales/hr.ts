import type { Translations } from './en'

export const hr: Translations = {
  common: {
    tryAgain: 'Pokušaj ponovno',
    cancel: 'Odustani',
    done: 'Gotovo',
    skip: 'Preskoči',
    somethingWentWrong: 'Nešto je pošlo po zlu',
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
  },
  profile: {
    guestName: 'Gost putnik',
    signInPrompt:
      'Prijavi se kako bi spremio gradove i ture sinkronizirao na više uređaja.',
    appearance: 'Izgled',
    language: 'Jezik',
    themeSystem: 'Sustav',
    themeLight: 'Svijetlo',
    themeDark: 'Tamno',
    languageSystem: 'Sustav',
  },
  city: {
    notFound: 'Taj grad nismo uspjeli pronaći.',
    sections: {
      excursions: 'Izleti',
      restaurants: 'Restorani',
      bars: 'Barovi',
      shopping: 'Kupovina',
    },
  },
  place: {
    notFound: 'To mjesto nismo uspjeli pronaći.',
    fallbackDescription:
      'Pažljivo odabrano mjesto vrijedno obilaska. Detalji i radno vrijeme uskoro stižu — za sada su dovoljni adresa i kategorija.',
    category: {
      restaurant: 'Restoran',
      bar: 'Bar',
      shopping: 'Kupovina',
    },
  },
  excursion: {
    notFound: 'Taj izlet nismo uspjeli pronaći.',
    locationDenied:
      'Pristup lokaciji odbijen. Omogući ga u Postavkama kako bismo te vodili do svake postaje.',
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
    },
    complete: {
      title: 'Tura završena',
      body: 'Posjetio si svih {{total}} postaja. Nadamo se da je vrijedilo.',
      done: 'Gotovo',
    },
    list: {
      current: 'Trenutno',
    },
    stopSheet: {
      audioTitle: 'Audio vodič',
      audioPrompt: 'Dodirni za reprodukciju',
      audioPlaying: 'Reproducira se…',
      audioMissing: 'Za ovu postaju još nema audio zapisa.',
    },
  },
}
