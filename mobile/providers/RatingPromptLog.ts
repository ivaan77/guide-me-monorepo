import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RatingTargetType } from '@guide-me-app/core'

// Cooldowns (prod values):
//   - Per-entity: 7 days between prompts for the same entity.
//   - Global:     1 day between prompts across ALL entities, so a user
//                 browsing many places in one session isn't spammed.
// In dev builds these are compressed to seconds so the flow is testable
// without wiping AsyncStorage between attempts. Real cooldowns kick in
// only in production builds.
// If the user has already rated the entity, we skip the prompt entirely —
// that check happens in the hook (needs access to /me data), not here.
const PER_ENTITY_COOLDOWN_MS = __DEV__ ? 10 * 1000 : 7 * 24 * 60 * 60 * 1000
const GLOBAL_COOLDOWN_MS = __DEV__ ? 5 * 1000 : 24 * 60 * 60 * 1000

const PER_ENTITY_KEY = (targetType: RatingTargetType, targetId: string) =>
  `guide-me:rating-prompt:${targetType}:${targetId}`
const GLOBAL_KEY = 'guide-me:rating-prompt:last'
const KEY_PREFIX = 'guide-me:rating-prompt:'

async function readTimestamp(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key)
  if (!raw) return 0
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
}

// Should we prompt this user for a rating on this entity right now?
// Returns false if either cooldown window is still open.
export async function isEligibleForPrompt(
  targetType: RatingTargetType,
  targetId: string,
): Promise<boolean> {
  const [entityAt, globalAt] = await Promise.all([
    readTimestamp(PER_ENTITY_KEY(targetType, targetId)),
    readTimestamp(GLOBAL_KEY),
  ])
  const now = Date.now()
  if (now - entityAt < PER_ENTITY_COOLDOWN_MS) return false
  if (now - globalAt < GLOBAL_COOLDOWN_MS) return false
  return true
}

// Dev-only helper: clears every rating-prompt cooldown so the sheet can
// fire again on next screen visit. Wire to a debug button or call from
// the JS console via `require('./providers/RatingPromptLog').resetPromptLog()`.
export async function resetPromptLog(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys()
  const ours = keys.filter((k) => k.startsWith(KEY_PREFIX))
  if (ours.length > 0) await AsyncStorage.multiRemove(ours)
}

// Record that the user was prompted for this entity right now. Also updates
// the global "last prompted anywhere" timestamp so the daily cooldown fires.
export async function markPrompted(
  targetType: RatingTargetType,
  targetId: string,
): Promise<void> {
  const now = Date.now().toString()
  await Promise.all([
    AsyncStorage.setItem(PER_ENTITY_KEY(targetType, targetId), now),
    AsyncStorage.setItem(GLOBAL_KEY, now),
  ])
}
