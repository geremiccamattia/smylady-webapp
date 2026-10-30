'use client'

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import i18next from 'i18next'
import { CONFIG, STORAGE_KEYS } from '@/lib/constants'
import { replaceWithPath } from '@/lib/navigation'

/**
 * Lesbare Meldung für eine 429 des ThrottlerGuard.
 *
 * Das Backend schickt (ab fix/429-sichtbar-machen) `code: 'RATE_LIMITED'`,
 * `message` und `retryAfter` in Sekunden. `message` ist nur deutsch — auf
 * Englisch wird deshalb aus `retryAfter` übersetzt. Die alte Antwort
 * („ThrottlerException: Too Many Requests") wird nie angezeigt.
 */
function rateLimitMessage(data: unknown): string {
  const body = (data ?? {}) as { code?: unknown; message?: unknown; retryAfter?: unknown }
  const english = i18next.language?.startsWith('en')
  if (body.code === 'RATE_LIMITED' && typeof body.message === 'string' && body.message && !english) {
    return body.message
  }
  const retryAfter = typeof body.retryAfter === 'number' && body.retryAfter > 0 ? Math.ceil(body.retryAfter) : null
  return retryAfter
    ? i18next.t('common.rateLimitedWait', {
        count: retryAfter,
        defaultValue: `Zu viele Anfragen in kurzer Zeit. Bitte warte ${retryAfter} Sekunden und versuche es erneut.`,
      })
    : i18next.t('common.rateLimited', {
        defaultValue: 'Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment und versuche es erneut.',
      })
}

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
    // Zentral für alle Aufrufer: Die meisten Stellen zeigen error.message an,
    // und das wäre sonst der rohe Axios-Text „Request failed with status code 429".
    // Status, Antwort und Sentry-Filter (instrumentation-client.ts) bleiben unberührt.
    if (error.response?.status === 429) {
      error.message = rateLimitMessage(error.response.data)
    }
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
        // '/register' deckt auch /register/brand ab — die Markenregistrierung
        // liegt genau deshalb dort und nicht unter einem eigenen Zweig.
        // '/join' ist die Auswahlseite davor und muss für Gäste erreichbar
        // bleiben, sonst wirft eine beliebige 401-Nebenanfrage sie auf /login.
        '/explore', '/login', '/register', '/join', '/event/', '/user/', '/feed', '/post/',
        // '/influencer' bleibt zusaetzlich drin, solange die 308-Weiterleitungen
        // in next.config.ts auf die alten URLs zeigen (Instagram, Mails, Google).
        // '/creator-' mit Bindestrich, NICHT '/creator': Sonst gälte per
        // startsWith auch /creator/apply als öffentlich, und ein Gast bliebe
        // dort auf einer Seite stehen, die ohne Token nichts laden kann.
        // Gemeint sind die Landingpages /creator-club und /creator-events.
        '/creator-', '/influencer', '/api', '/communities',
        // Scan-Zugang für Personal ohne Konto. Muss hier stehen, sonst wirft eine
        // beliebige 401-Nebenanfrage (z.B. getCurrentUser mit abgelaufenem Token
        // im localStorage) das Einlasspersonal auf /login — wo es sich mangels
        // Konto nicht anmelden könnte. Mit Schrägstrich, damit /settings,
        // /stories und /subscribers nicht mitmatchen.
        '/s/',
        // Die Vorschau einer Brand-Einladung braucht keinen Login. Nur dieser
        // Pfad: /brand und /brand/team bleiben geschützt.
        '/brand/invite',
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
        // Rücksprung auf die aktuelle Seite samt Query (?next=): Eine Brand,
        // die aus dem Stripe-Checkout mit ?payment=success zurückkommt und
        // deren Sitzung abgelaufen ist, landet nach dem Login wieder genau
        // dort. safeNextPath in lib/postLogin.ts prüft den Wert beim Lesen.
        const { pathname, search } = window.location
        // replace statt assign: die abgelaufene Seite soll nicht im Verlauf bleiben,
        // sonst landet der Zurück-Button direkt wieder im 401.
        replaceWithPath(`${localePrefix}/login?next=${encodeURIComponent(pathname + search)}`)
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
