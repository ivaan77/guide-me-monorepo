export const en = {
  common: {
    tryAgain: 'Try again',
    cancel: 'Cancel',
    done: 'Done',
    skip: 'Skip',
    somethingWentWrong: 'Something went wrong',
  },
  tabs: {
    discover: 'Discover',
    favorites: 'Favorites',
    profile: 'Profile',
  },
  discover: {
    searchPlaceholder: 'Search cities or countries',
    noResultsTitle: 'No matches',
    noResultsBody: 'We couldn’t find any cities matching "{{query}}". Try a different name or country.',
    errorBody: 'We couldn’t load the city list right now.',
  },
  favorites: {
    emptyTitle: 'No favorites yet',
    emptyBody: 'Cities you save will show up here so you can plan your next trip.',
  },
  profile: {
    guestName: 'Guest traveler',
    signInPrompt: 'Sign in to sync your saved cities and itineraries across devices.',
    appearance: 'Appearance',
    language: 'Language',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageSystem: 'System',
  },
  city: {
    notFound: 'We couldn’t find that city.',
    sections: {
      excursions: 'Excursions',
      restaurants: 'Restaurants',
      bars: 'Bars',
      shopping: 'Shopping',
    },
  },
  place: {
    notFound: 'We couldn’t find that place.',
    fallbackDescription:
      'A handpicked spot worth a detour. Detailed notes and opening hours are coming soon — for now, the address and category are all you need to start.',
    category: {
      restaurant: 'Restaurant',
      bar: 'Bar',
      shopping: 'Shopping',
    },
  },
  excursion: {
    notFound: 'We couldn’t find that excursion.',
    locationDenied: 'Location access denied. Enable it in Settings to be guided to each stop.',
    preview: {
      title: 'Ready to explore?',
      subtitle: '{{count}} stops · we’ll guide you between each.',
      start: 'Start',
    },
    navigating: {
      stopOf: 'Stop {{index}} of {{total}}',
    },
    arrived: {
      arrivedLabel: 'You’ve arrived · Stop {{index}} of {{total}}',
      moreInfo: 'More info',
      continue: 'Continue',
      finish: 'Finish',
    },
    complete: {
      title: 'Tour complete',
      body: 'You visited all {{total}} stops. Hope it was worth the walk.',
      done: 'Done',
    },
    list: {
      current: 'Current',
    },
    stopSheet: {
      audioTitle: 'Audio guide',
      audioPrompt: 'Tap play to listen',
      audioPlaying: 'Playing…',
      audioMissing: 'No audio uploaded for this stop yet.',
    },
  },
}

export type Translations = typeof en
