import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './locales/de'
import { en } from './locales/en'
import { hr } from './locales/hr'

export const SUPPORTED_LANGUAGES = ['en', 'de', 'hr'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

let initialized = false

export function initI18n(initialLanguage: SupportedLanguage) {
  if (initialized) return
  initialized = true
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      hr: { translation: hr },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  })
}

export function changeLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang)
}

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
