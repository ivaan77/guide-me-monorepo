import { PostHogProvider as RawProvider } from 'posthog-react-native'

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

// Wraps the mobile tree with PostHog when a project key is present. In dev
// without the key set (running against a fresh clone), we render children
// without the SDK — every usePostHog() consumer gets a null and no-ops.
// This keeps the app runnable without leaking events to an unknown project
// or crashing on missing config.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    if (__DEV__) {
      console.log(
        '[analytics] EXPO_PUBLIC_POSTHOG_KEY not set — skipping PostHog init.',
      )
    }
    return <>{children}</>
  }
  return (
    <RawProvider
      apiKey={POSTHOG_KEY}
      options={{
        host: POSTHOG_HOST,
        // Auto-capture app-open events + screen views. Keeps the marketing
        // counter for "users last year" grounded in real activity rather
        // than only counting sign-ups.
        captureAppLifecycleEvents: true,
        // Flush events sooner than the default so dev sessions surface
        // quickly in the PostHog UI. Production defaults would batch up
        // to 20 events / 30s.
        flushAt: __DEV__ ? 1 : 20,
        flushInterval: __DEV__ ? 5_000 : 30_000,
      }}
      autocapture={{
        // Deliberately disable navigation autocapture — we send explicit
        // events for the three counters we care about. Navigation events
        // would eat into the free tier without moving any metric.
        captureScreens: false,
        captureTouches: false,
      }}
    >
      {children}
    </RawProvider>
  )
}
