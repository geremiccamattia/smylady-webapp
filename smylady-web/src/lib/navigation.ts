/**
 * Zentrale Helfer für harte Navigationen (Full Page Load).
 *
 * Direkte Zuweisungen an `window.location.href` werden von Security-Scannern
 * (Aikido) als potenzieller Open Redirect gemeldet: an der Zuweisungsstelle ist
 * nicht nachweisbar, dass das Ziel auf der eigenen Origin liegt. Deshalb laufen
 * alle harten Navigationen über diese Funktionen — sie prüfen das Ziel, bevor
 * gesprungen wird, und kapseln die einzige Stelle, an der `window.location`
 * tatsächlich beschrieben wird.
 *
 * Für Navigationen innerhalb der App ist weiterhin `router.push()` bzw. `<Link>`
 * die erste Wahl; diese Helfer sind nur für die Fälle da, die bewusst einen
 * kompletten Reload brauchen (Sprachwechsel, Logout, 401-Redirect).
 */

// Backslash + Steuerzeichen: Browser normalisieren "\" zu "/", wodurch "/\evil.com"
// zur protokoll-relativen URL wird. Tab/Newline werden beim URL-Parsen entfernt und
// lassen sich deshalb einstreuen, um eine naive Prefix-Prüfung zu umgehen.
const CONTROL_OR_BACKSLASH = /[\\\u0000-\u001F\u007F]/

/**
 * True nur für absolute Pfade auf der eigenen Origin, z.B. `/login`,
 * `/en/explore?q=techno#top`.
 *
 * Abgelehnt werden insbesondere:
 * - `//evil.com` und `/\evil.com` — protokoll-relative URLs, die die Origin verlassen
 * - `https://evil.com`, `javascript:...` — alles mit Schema
 * - Pfade mit Backslash oder Steuerzeichen, die Browser unterschiedlich normalisieren
 */
export function isSafeInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  return !CONTROL_OR_BACKSLASH.test(path)
}

/**
 * Navigiert zu einem app-internen Pfad (neuer History-Eintrag).
 * Gibt `false` zurück und navigiert nicht, wenn der Pfad die Origin verlassen würde.
 */
export function navigateToPath(path: string): boolean {
  if (typeof window === 'undefined') return false
  if (!isSafeInternalPath(path)) {
    console.error('[navigation] Redirect zu nicht-internem Pfad blockiert:', path)
    return false
  }
  window.location.assign(path)
  return true
}

/**
 * Wie {@link navigateToPath}, ersetzt aber den aktuellen History-Eintrag.
 * Für Redirects, zu denen der Zurück-Button nicht führen soll (z.B. 401 → Login).
 */
export function replaceWithPath(path: string): boolean {
  if (typeof window === 'undefined') return false
  if (!isSafeInternalPath(path)) {
    console.error('[navigation] Redirect zu nicht-internem Pfad blockiert:', path)
    return false
  }
  window.location.replace(path)
  return true
}

/**
 * Navigiert zu einer externen URL — nur über HTTPS und nur zu einem Host aus
 * `allowedHosts` (exakter Host oder Subdomain davon).
 *
 * Die Prüfung läuft über `new URL()`, deshalb greift sie auch bei Tricks wie
 * `https://erlaubter-host.de@evil.com`: dort ist `hostname` `evil.com`.
 */
export function navigateToExternalUrl(url: string, allowedHosts: string[]): boolean {
  if (typeof window === 'undefined') return false

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    console.error('[navigation] Redirect zu ungültiger URL blockiert:', url)
    return false
  }

  if (parsed.protocol !== 'https:') {
    console.error('[navigation] Redirect zu unsicherer URL blockiert:', url)
    return false
  }

  const host = parsed.hostname.toLowerCase()
  const isAllowed = allowedHosts.some((allowed) => {
    const normalized = allowed.toLowerCase()
    return host === normalized || host.endsWith(`.${normalized}`)
  })

  if (!isAllowed) {
    console.error('[navigation] Redirect zu nicht erlaubtem Host blockiert:', parsed.hostname)
    return false
  }

  window.location.assign(parsed.toString())
  return true
}
