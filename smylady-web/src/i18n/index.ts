'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import de from './locales/de.json'
import en from './locales/en.json'

const LANGUAGE_KEY = 'syp_language'

// Get saved language or default to German
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en }
    },
    lng: savedLanguage || 'de', // Default to German
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage']
    },
    saveMissing: true,
    missingKeyHandler: (_lng, _ns, key, fallbackValue) => {
      if (_lng.includes('en')) {
        console.warn(`[i18n MISSING EN] ${key} → "${fallbackValue}"`)
      }
    }
  })

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_KEY, lng)
})

export default i18n
export { LANGUAGE_KEY }
