/**
 * Prüfung für URLs, die aus fremder Hand stammen — Event-, User-, Community- und
 * Spotlight-Daten, die ein Veranstalter, Werbekunde oder Nutzer frei eintippen kann.
 *
 * Landet so ein Wert ungeprüft in einem `href` oder in `window.open()`, ist
 * `javascript:alert(document.cookie)` ausführbarer Code im Origin der App — React
 * blockiert das nicht, es warnt nur im Dev-Modus. Deshalb geht jeder solche Wert
 * durch {@link safeExternalUrl}, und ein Link, für den `null` zurückkommt, wird
 * gar nicht erst gerendert.
 *
 * Für Navigationen auf der eigenen Origin ist weiterhin `lib/navigation.ts`
 * zuständig; dort gilt eine strengere Regel (nur https + Host-Allowlist).
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:']

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Gibt die URL normalisiert zurück, wenn sie über http/https läuft — sonst `null`.
 *
 * - `https://example.com/x` → unverändert übernommen
 * - `example.com/x` → ohne Schema, wird als `https://example.com/x` geprüft
 * - `javascript:`, `data:`, `vbscript:`, `file:` → `null`
 *
 * Geprüft wird über `new URL()`, nicht per Regex auf dem Rohstring: Nur der Parser
 * kommt an das tatsächliche Protokoll heran. Eingestreute Steuerzeichen wie
 * `java\nscript:` würden eine Textprüfung austricksen, der Parser normalisiert sie
 * weg — deshalb wird auch der normalisierte `href` zurückgegeben und nicht der
 * Rohwert.
 *
 * Der Fallback greift bewusst nur, wenn der Rohwert gar nicht parsebar ist. Ein
 * Wert mit Schema wird nie nachträglich mit `https://` „gerettet“, sonst würde aus
 * einem abgelehnten `javascript:…` ein gültiger Link auf einen fremden Host.
 * Nebeneffekt: `example.com:8080/x` liest der Parser als Schema `example.com:` und
 * wird deshalb abgelehnt — im Zweifel lieber ein Link zu wenig als einer zu viel.
 */
export function safeExternalUrl(value?: string | null): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = parseUrl(trimmed) ?? parseUrl(`https://${trimmed}`)
  if (!parsed) return null
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return null

  return parsed.href
}
