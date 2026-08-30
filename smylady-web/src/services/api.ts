'use client'

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { CONFIG, STORAGE_KEYS } from '@/lib/constants'
import { replaceWithPath } from '@/lib/navigation'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // War auf der fehlgeschlagenen Anfrage überhaupt ein Bearer-Token dabei?
      // Guest-Nebenanfragen (z.B. auf /explore, ohne eingeloggten User) laufen
      // ohne Authorization-Header und liefern an geschützten Endpoints ebenfalls
      // 401 — das ist erwartetes Verhalten für einen Gast, kein Session-Fehler.
      // WICHTIG: Token/User NUR löschen, wenn WIR selbst einen Header gesendet
      // haben und der vom Backend abgelehnt wurde. Sonst verliert ein
      // eingeloggter Nutzer auf /explore seine Session, sobald irgendeine
      // parallele Guest-artige Nebenanfrage zufällig 401 liefert — ein stiller,
      // kaum reproduzierbarer Logout. Diese Bedingung ist also KEIN überflüssiger
      // Zusatz-Check, sondern der eigentliche Bugfix — bitte nicht entfernen.
      const hadAuthHeader = Boolean(error.config?.headers?.Authorization)
      // Don't clear token when returning from Spotify OAuth
      const isSpotifyReturn = window.location.search.includes('spotify=')
      if (hadAuthHeader && !isSpotifyReturn) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      }
      // Redirect-Logik bleibt bewusst UNABHÄNGIG von hadAuthHeader: ein Gast auf
      // einer geschützten (nicht-öffentlichen) Seite soll weiterhin zu /login.
      const publicPaths = [
        '/explore', '/login', '/register', '/event/', '/user/', '/feed', '/post/',
        // '/influencer' bleibt zusaetzlich drin, solange die 308-Weiterleitungen
        // in next.config.ts auf die alten URLs zeigen (Instagram, Mails, Google).
        '/creator', '/influencer', '/api', '/communities',
      ]
      // Locale-Prefix abschneiden, sonst gilt /en/explore nicht als public und ein 401
      // einer Nebenanfrage wirft den Besucher von einer öffentlichen Seite auf /login.
      // Lookahead, damit nur ein echtes Segment matcht (/en/... oder /en), nicht /events.
      const pathWithoutLocale = window.location.pathname.replace(/^\/(en|de)(?=\/|$)/, '') || '/'
      const isPublicPath =
        pathWithoutLocale === '/' ||
        publicPaths.some(path => pathWithoutLocale.startsWith(path))
      if (!isPublicPath) {
        // Sprache beim Redirect halten — sonst landen EN-Nutzer auf der deutschen Seite
        const localePrefix = /^\/en(?=\/|$)/.test(window.location.pathname) ? '/en' : ''
        // replace statt assign: die abgelaufene Seite soll nicht im Verlauf bleiben,
        // sonst landet der Zurück-Button direkt wieder im 401.
        replaceWithPath(`${localePrefix}/login`)
      }
    }
    return Promise.reject(error)
  }
)

const publicClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export { apiClient, publicClient }
