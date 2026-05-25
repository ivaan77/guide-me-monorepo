import AsyncStorage from '@react-native-async-storage/async-storage'

// Stores whether the user has already made a choice on the first-launch
// login screen. `skipped` keeps the app anonymous; `signed-in` means we
// completed a Clerk sign-in once (Clerk itself persists the session token
// independently, so this flag exists purely to dismiss the gate).
const KEY = 'guide-me:auth-choice'

export type AuthChoice = 'signed-in' | 'skipped'

export async function readAuthChoice(): Promise<AuthChoice | null> {
  const value = await AsyncStorage.getItem(KEY)
  return value === 'signed-in' || value === 'skipped' ? value : null
}

export async function writeAuthChoice(choice: AuthChoice): Promise<void> {
  await AsyncStorage.setItem(KEY, choice)
}

export async function clearAuthChoice(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}
