import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useAuth, useUser } from '@clerk/clerk-expo'
import * as Application from 'expo-application'
import { usePostHog } from 'posthog-react-native'
import { useAppLanguage } from './LanguageContext'

// One-shot heuristic for "was this sign-in a brand-new user?"  Clerk
// doesn't broadcast "signup vs signin" events to the client — but it does
// expose the user's account creation timestamp. If we see a signed-in
// user whose account was created within this window, treat this as their
// signup event. Wide enough to cover slow onboarding (verify email,
// enter profile, etc), tight enough not to reclassify a returning user
// whose token was just refreshed.
const SIGNUP_RECENT_WINDOW_MS = 5 * 60 * 1000

// Bridges Clerk's auth state into PostHog identity.
//
// - On sign-in: alias the anonymous distinct_id to the Clerk userId so the
//   pre-signup activity (app opens, screen views, first excursion browse)
//   stitches into the same person once they create an account.
// - On brand-new sign-ups (see window above): also emit a `user_signup`
//   event so the marketing counter has a first-class metric to query.
// - On sign-out: reset the distinct_id back to a fresh anonymous id so the
//   next signed-in person on this device doesn't collide with the previous
//   one.
export function PostHogIdentityGate({
  children,
}: {
  children: React.ReactNode
}) {
  const posthog = usePostHog()
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const { resolved: appLocale } = useAppLanguage()

  // Track the last identity we told PostHog about so we don't re-emit on
  // every render. `null` means "currently anonymous"; a string is a Clerk
  // userId we've identified.
  const lastIdentityRef = useRef<string | null>(null)
  // Serialised snapshot of the last identify() properties we sent. Used
  // to skip redundant calls when the user just typed something else that
  // caused a re-render but didn't change any of the fields we ship.
  const lastPropsSnapshotRef = useRef<string | null>(null)
  const signupEmittedRef = useRef<Set<string>>(new Set())

  // Name fields — split into first/last (better PostHog cohort UX) plus
  // $name so PostHog's built-in person UI picks it up automatically. All
  // sanitised through trim() + coerced to undefined so we don't ship
  // empty-string properties that PostHog would still treat as "set".
  const firstName = user?.firstName?.trim() || undefined
  const lastName = user?.lastName?.trim() || undefined
  const fullName = user?.fullName?.trim() || undefined

  useEffect(() => {
    if (!posthog) return
    if (!authLoaded) return

    if (isSignedIn && userId) {
      // Deliberate NOT-included: email, phone, primary email, external
      // account provider. Email + provider are consent-gated (see prior
      // comment). Add here once a marketing opt-in preference lands.
      const raw = {
        first_name: firstName,
        last_name: lastName,
        $name: fullName ?? firstName,
        app_locale: appLocale,
        platform: Platform.OS as string,
        app_version: Application.nativeApplicationVersion ?? undefined,
      }
      // PostHog's props type rejects `undefined` values, so drop empty
      // slots rather than shipping a "field: null" that would overwrite
      // an existing person property in PostHog with no data.
      const props: Record<string, string> = {}
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === 'string' && v.length > 0) props[k] = v
      }
      const snapshot = JSON.stringify(props)
      const identityChanged = lastIdentityRef.current !== userId
      const propsChanged = lastPropsSnapshotRef.current !== snapshot

      if (identityChanged || propsChanged) {
        posthog.identify(userId, props)
        lastIdentityRef.current = userId
        lastPropsSnapshotRef.current = snapshot
      }

      // Signup detection: emit exactly-once per Clerk userId per process.
      // Runs only on the initial identify for this userId (identityChanged)
      // so a subsequent profile-edit re-identify doesn't re-emit.
      if (
        identityChanged &&
        !signupEmittedRef.current.has(userId) &&
        user?.createdAt
      ) {
        const createdMs = new Date(user.createdAt).getTime()
        const ageMs = Date.now() - createdMs
        if (ageMs >= 0 && ageMs < SIGNUP_RECENT_WINDOW_MS) {
          posthog.capture('user_signup')
          signupEmittedRef.current.add(userId)
        }
      }
    } else if (!isSignedIn && lastIdentityRef.current) {
      posthog.reset()
      lastIdentityRef.current = null
      lastPropsSnapshotRef.current = null
    }
  }, [
    posthog,
    authLoaded,
    isSignedIn,
    userId,
    user?.createdAt,
    firstName,
    lastName,
    fullName,
    appLocale,
  ])

  return <>{children}</>
}
