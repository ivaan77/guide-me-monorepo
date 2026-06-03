import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import * as Haptics from 'expo-haptics'

// One-shot audio + haptic feedback for moments-of-delight in the navigation
// flow. We lazily create AudioPlayer instances the first time each sound is
// played and reuse them — creating a fresh player per event would leak the
// native audio session and add 50ms of latency to every call.
//
// The players are module-level singletons because the events that fire them
// (arrival, fact banner) are scattered across screens; threading a player
// instance through props would be noisy.

// require() the bundled assets eagerly so the Metro bundler resolves them
// at module evaluation. The actual audio file isn't decoded until the first
// play() call.
const ARRIVAL_SOURCE = require('../assets/sounds/arrival.mp3')
const FACT_SOURCE = require('../assets/sounds/fact.mp3')

let arrivalPlayer: AudioPlayer | null = null
let factPlayer: AudioPlayer | null = null

function getArrivalPlayer(): AudioPlayer {
  if (!arrivalPlayer) {
    arrivalPlayer = createAudioPlayer(ARRIVAL_SOURCE)
  }
  return arrivalPlayer
}

function getFactPlayer(): AudioPlayer {
  if (!factPlayer) {
    factPlayer = createAudioPlayer(FACT_SOURCE)
  }
  return factPlayer
}

// Fires when the user reaches a stop. Success-style haptic (a double-tap
// notification pulse) plus a soft chime. Roughly 1 second of total feedback.
export function playArrivalFeedback(): void {
  // Haptic and audio fire in parallel — neither awaits the other.
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {
      // Devices without a Taptic Engine / vibrator silently ignore.
    },
  )
  try {
    const player = getArrivalPlayer()
    // Seek to 0 in case this is a repeat — otherwise the player would be
    // at duration and play() would no-op.
    player.seekTo(0)
    player.play()
  } catch {
    // Audio session unavailable (e.g. silent mode on iOS for some configs).
    // Haptic still fires, which is fine.
  }
}

// Fires when the floating fact banner shows a new fact. Lighter than arrival
// — a subtle impact + soft ping. Companion-style, easy to ignore.
export function playFactFeedback(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // ignore
  })
  try {
    const player = getFactPlayer()
    player.seekTo(0)
    player.play()
  } catch {
    // ignore
  }
}
