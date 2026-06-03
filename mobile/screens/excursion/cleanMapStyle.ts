// Google Maps style JSON that hides all built-in points of interest, transit
// stops, and business labels so only our custom markers (stops, POIs, user
// pin) remain visible. The map keeps roads, road names, water, and landscape
// labels — without them the map is hard to read while walking.
//
// Reference for style schema: https://developers.google.com/maps/documentation/javascript/style-reference
// `react-native-maps` accepts this JSON via `customMapStyle` whenever the
// MapView uses `provider={PROVIDER_GOOGLE}`. We set Google as the provider
// on both iOS and Android, so this style applies uniformly.
export const CLEAN_MAP_STYLE = [
  // Hide every point of interest the map renders by default: restaurants,
  // attractions, parks (as POIs — the underlying park geometry stays), etc.
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  // Hide transit stations, bus stops, subway entrances. We don't show
  // transit info in this app and the icons clutter the map.
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  // Hide business markers explicitly (some Google styles render these
  // separately from `poi`).
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
]
