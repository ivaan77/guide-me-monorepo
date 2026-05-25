import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Guide Me',
  slug: 'guide-me',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'guideme',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.guide.me',
    usesAppleSignIn: true,
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
      backgroundColor: '#0B1F3A',
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
    'expo-audio',
    'expo-secure-store',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        // Gradient + centered mark are baked into splash.png so resizeMode
        // 'cover' fills the device edge-to-edge with the artwork.
        // backgroundColor is the gradient's top color and shows on any
        // letterbox gap from odd aspect ratios.
        image: './assets/images/splash.png',
        resizeMode: 'cover',
        backgroundColor: '#0B1F3A',
        dark: {
          image: './assets/images/splash.png',
          backgroundColor: '#0B1F3A',
        },
      },
    ],
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
