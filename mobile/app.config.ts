import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'HeyLocal',
  slug: 'heylocal',
  owner: 'ivaanboss7',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'heylocal',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.heylocal.app',
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'HeyLocal uses your location to walk you to each stop on your excursion.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.heylocal.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#011536',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
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
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#011536',
        resizeMode: 'contain',
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: '#011536',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'HeyLocal uses your location to walk you to each stop on your excursion.',
      },
    ],
    [
      'react-native-maps',
      {
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: 'e857b84c-d6e5-4541-a977-1992ffac20ff',
    },
  },
}

export default config
