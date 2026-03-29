import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import de from './locales/de.json'
import en from './locales/en.json'

const LANGUAGE_KEY = 'syp_language'

// Get saved language or default to German
const savedLanguage = localStorage.getItem(LANGUAGE_KEY)

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
    }
  })

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng)
})

export default i18n
export { LANGUAGE_KEY }
