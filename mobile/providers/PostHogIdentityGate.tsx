import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { usePostHog } from 'posthog-react-native'

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

  // Track the last identity we told PostHog about so we don't re-emit on
  // every render. `null` means "currently anonymous"; a string is a Clerk
  // userId we've identified.
  const lastIdentityRef = useRef<string | null>(null)
  const signupEmittedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!posthog) return
    if (!authLoaded) return

    if (isSignedIn && userId) {
      if (lastIdentityRef.current !== userId) {
        posthog.identify(userId, {
          // Optional metadata — email address is not required for the
          // counter aggregates and Clerk asks us not to store it in
          // analytics without explicit consent. Add later if we build
          // a "marketing opt-in" preference.
        })
        lastIdentityRef.current = userId

        // Signup detection: emit exactly-once per Clerk userId per process.
        // AsyncStorage would give us stronger guarantees, but PostHog
        // itself de-duplicates on distinct_id + event + a fine-grained
        // timestamp, and the createdAt window bounds the double-count
        // risk to reinstalls-of-a-brand-new-user (rare + acceptable).
        if (!signupEmittedRef.current.has(userId) && user?.createdAt) {
          const createdMs = new Date(user.createdAt).getTime()
          const ageMs = Date.now() - createdMs
          if (ageMs >= 0 && ageMs < SIGNUP_RECENT_WINDOW_MS) {
            posthog.capture('user_signup')
            signupEmittedRef.current.add(userId)
          }
        }
      }
    } else if (!isSignedIn && lastIdentityRef.current) {
      posthog.reset()
      lastIdentityRef.current = null
    }
  }, [posthog, authLoaded, isSignedIn, userId, user?.createdAt])

  return <>{children}</>
}
