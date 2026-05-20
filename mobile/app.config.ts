import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Guide Me',
  slug: 'guide-me',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'guideme',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF7F2',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.guide.me',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Guide Me uses your location to walk you to each stop on your excursion.',
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
    },
  },
  android: {
    package: 'com.guide.me',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FAF7F2',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    'expo-localization',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Guide Me uses your location to walk you to each stop on your excursion.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
}

export default config
