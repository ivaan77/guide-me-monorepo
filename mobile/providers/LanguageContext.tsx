import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  type SupportedLanguage,
  changeLanguage,
  initI18n,
  isSupportedLanguage,
} from '../i18n'

export type LanguageMode = 'system' | SupportedLanguage

type LanguageContextValue = {
  mode: LanguageMode
  resolved: SupportedLanguage
  setMode: (mode: LanguageMode) => void
}

const STORAGE_KEY = 'guide-me:language-mode'

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolveFromSystem(): SupportedLanguage {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en'
  return isSupportedLanguage(tag) ? tag : 'en'
}

function resolve(mode: LanguageMode): SupportedLanguage {
  return mode === 'system' ? resolveFromSystem() : mode
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LanguageMode>('system')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const initial: LanguageMode =
          stored === 'system' ||
          stored === 'en' ||
          stored === 'de' ||
          stored === 'hr'
            ? stored
            : 'system'
        setModeState(initial)
        initI18n(resolve(initial))
      })
      .finally(() => setHydrated(true))
  }, [])

  const setMode = (next: LanguageMode) => {
    setModeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
    changeLanguage(resolve(next))
  }

  const resolved = resolve(mode)

  const value = useMemo<LanguageContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved],
  )

  if (!hydrated) return null

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useAppLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useAppLanguage must be used inside LanguageProvider')
  return ctx
}
