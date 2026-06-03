import type { Translations } from './en'

export const de: Translations = {
  common: {
    tryAgain: 'Erneut versuchen',
    cancel: 'Abbrechen',
    done: 'Fertig',
    skip: 'Überspringen',
    somethingWentWrong: 'Etwas ist schiefgelaufen',
    offline: 'Keine Internetverbindung',
  },
  tabs: {
    discover: 'Entdecken',
    favorites: 'Favoriten',
    profile: 'Profil',
  },
  discover: {
    searchPlaceholder: 'Städte oder Länder suchen',
    noResultsTitle: 'Keine Treffer',
    noResultsBody:
      'Für „{{query}}" wurden keine Städte gefunden. Probiere einen anderen Namen oder ein anderes Land.',
    errorBody: 'Die Städteliste lässt sich gerade nicht laden.',
  },
  favorites: {
    emptyTitle: 'Noch keine Favoriten',
    emptyBody:
      'Hier erscheinen die Städte, die du speicherst, damit du deine nächste Reise planen kannst.',
    signInRequiredTitle: 'Melde dich an, um Favoriten zu speichern',
    signInRequiredBody:
      'Zum Speichern von Städten, Ausflügen und Orten brauchst du ein Konto, damit wir sie geräteübergreifend synchronisieren können.',
    errorBody: 'Deine Favoriten konnten gerade nicht geladen werden.',
    sections: {
      cities: 'Städte',
      excursions: 'Ausflüge',
      places: 'Orte',
    },
  },
  profile: {
    guestName: 'Gast',
    signInPrompt:
      'Melde dich an, um gespeicherte Städte und Routen geräteübergreifend zu synchronisieren.',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    appearance: 'Erscheinungsbild',
    language: 'Sprache',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    languageSystem: 'System',
  },
  auth: {
    titleA: 'Von hier',
    titleB: 'nach dort.',
    subtitle:
      'Melde dich an, um Favoriten zu speichern und geräteübergreifend zu synchronisieren – oder erkunde als Gast.',
    continueWithGoogle: 'Mit Google fortfahren',
    continueWithApple: 'Mit Apple fortfahren',
    skip: 'Ohne Anmeldung fortfahren',
    signInFailedTitle: 'Anmeldung fehlgeschlagen',
  },
  city: {
    notFound: 'Diese Stadt konnten wir nicht finden.',
    audioTitle: 'Über diese Stadt',
    audioPrompt: 'Zum Abspielen tippen',
    audioPlaying: 'Wird abgespielt…',
    sections: {
      excursions: 'Ausflüge',
      restaurants: 'Restaurants',
      cafes: 'Cafés',
      bars: 'Bars',
      shopping: 'Shopping',
      events: 'Veranstaltungen',
      parks: 'Parks',
    },
    subCategoryOther: 'Sonstige',
  },
  place: {
    notFound: 'Diesen Ort konnten wir nicht finden.',
    fallbackDescription:
      'Ein handverlesener Ort, der einen Umweg wert ist. Details und Öffnungszeiten folgen bald — vorerst genügen Adresse und Kategorie für den Anfang.',
    audioTitle: 'Audioguide',
    audioPrompt: 'Zum Abspielen tippen',
    audioPlaying: 'Wird abgespielt…',
    category: {
      restaurant: 'Restaurant',
      cafe: 'Café',
      bar: 'Bar',
      shopping: 'Shopping',
      event: 'Veranstaltung',
      park: 'Park',
    },
  },
  excursion: {
    notFound: 'Diesen Ausflug konnten wir nicht finden.',
    locationDenied:
      'Standortzugriff verweigert. Aktiviere ihn in den Einstellungen, um zu jeder Station geführt zu werden.',
    preview: {
      title: 'Bereit zur Entdeckung?',
      subtitle: '{{count}} Stationen · wir führen dich zwischen ihnen.',
      start: 'Starten',
    },
    navigating: {
      stopOf: 'Station {{index}} von {{total}}',
    },
    arrived: {
      arrivedLabel: 'Angekommen · Station {{index}} von {{total}}',
      moreInfo: 'Mehr Infos',
      continue: 'Weiter',
      finish: 'Beenden',
    },
    complete: {
      title: 'Tour abgeschlossen',
      body: 'Du hast alle {{total}} Stationen besucht. Hoffentlich hat sich der Weg gelohnt.',
      done: 'Fertig',
    },
    list: {
      current: 'Aktuell',
    },
    stopSheet: {
      audioTitle: 'Audioguide',
      audioPrompt: 'Zum Abspielen tippen',
      audioPlaying: 'Wird abgespielt…',
      audioMissing: 'Für diese Station gibt es noch kein Audio.',
    },
    facts: {
      sectionTitle: 'Wissenswertes',
      sheetPrompt: 'Zum Abspielen tippen',
      playing: 'Wird abgespielt…',
      bannerLabel: 'Wusstest du schon?',
    },
  },
}
