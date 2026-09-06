import { MUSIC_TYPES } from '@/lib/constants'

/**
 * Normalisierung der Event-Felder, die das Backend inzwischen als Array liefert.
 *
 * `musicType` und `offerings` waren früher Strings (teils komma-separiert, teils
 * JSON-kodiert) und sind jetzt echte Arrays. Alte Datensätze tragen aber weiterhin
 * die alten Formen, und die Mobile-App schreibt möglicherweise noch anders —
 * deshalb akzeptieren die Helfer hier bewusst beides.
 *
 * `restrictions` bleibt ein Freitextfeld und wird hier nicht behandelt.
 */

/**
 * Bringt einen Feldwert auf ein String-Array — egal ob er als Array, als
 * komma-separierter String oder als JSON-String ankommt.
 *
 * Diese Logik stand vorher dreimal im Code (EventDetailClient, EditEvent,
 * parseStringField). Leere Einträge fallen raus.
 */
export function toStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap(toStringArray)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        return toStringArray(JSON.parse(trimmed))
      } catch {
        // Kein gültiges JSON — unten als Komma-Liste behandeln.
      }
    }
    return trimmed
      ? trimmed.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  }
  return [String(value)]
}

/** Minimale Signatur von i18next `t`. */
type TFunc = (key: string, options?: Record<string, unknown>) => string

/**
 * Auswahlwerte für die Musikrichtung — exakt die Werte des Backend-Enums
 * `MusicType` (src/types/common.ts). Das Backend prüft mit `@IsEnum(..., { each: true })`,
 * ein unbekannter Wert führt also zu einer 400.
 *
 * ACHTUNG: Die alte Liste in lib/constants.ts führte `hiphop`, das Enum kennt aber
 * nur `hip_hop` — damit wäre jedes Speichern mit dieser Auswahl fehlgeschlagen.
 * Deshalb steht die maßgebliche Liste jetzt hier.
 */
export const MUSIC_TYPE_VALUES = [
  { value: 'electronic', label: 'Electronic' },
  { value: 'house', label: 'House' },
  { value: 'techno', label: 'Techno' },
  { value: 'trance', label: 'Trance' },
  { value: 'dnb', label: 'Drum & Bass' },
  { value: 'hip_hop', label: 'Hip-Hop' },
  { value: 'rnb', label: 'R&B' },
  { value: 'soul', label: 'Soul' },
  { value: 'afrobeats', label: 'Afrobeats' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'latin', label: 'Latin' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'metal', label: 'Metal' },
  { value: 'indie', label: 'Indie' },
  { value: 'folk', label: 'Folk' },
  { value: 'country', label: 'Country' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Klassik' },
  { value: 'live_band', label: 'Live-Band' },
  { value: 'dj_set', label: 'DJ-Set' },
  { value: 'mixed', label: 'Gemischt' },
  { value: 'no_music', label: 'Keine Musik' },
  { value: 'other', label: 'Sonstiges' },
] as const

/** Auswahlwerte für das Angebot. Das Backend prüft hier nur auf Strings, kein Enum. */
export const OFFERING_VALUES = [
  { value: 'pool', label: 'Pool' },
  { value: 'food_drinks', label: 'Essen & Trinken' },
  { value: 'drinks', label: 'Getränke' },
  { value: 'grill', label: 'Grill' },
  { value: 'terrasse', label: 'Terrasse' },
  { value: 'feuerstelle', label: 'Feuerstelle' },
  { value: 'other', label: 'Sonstiges' },
] as const

/**
 * Reihenfolge beachten: Bei doppelten Schlüsseln gewinnt im Map-Konstruktor der
 * spätere Eintrag. Die Altliste steht deshalb zuerst und steuert nur bei, was in
 * MUSIC_TYPE_VALUES fehlt — etwa das dort ausgemusterte `hiphop`. Andersherum
 * hätte constants.ts das Label überschrieben und `mixed` wäre wieder als
 * „Mixed“ statt „Gemischt“ erschienen.
 */
const MUSIC_TYPE_LABELS = new Map<string, string>([
  // Altbestand aus der früheren Liste in constants.ts
  ...MUSIC_TYPES.map((m) => [m.value, m.label] as [string, string]),
  ...MUSIC_TYPE_VALUES.map((m) => [m.value, m.label] as [string, string]),
])

/**
 * Anzeigename einer Musikrichtung.
 *
 * Übersetzt über `musicTypes.<wert>` mit dem Label aus MUSIC_TYPES als
 * defaultValue — dasselbe Muster, das CreateEvent schon nutzt. Unbekannte Werte
 * (etwa aus Ticketmaster-Importen) werden unverändert durchgereicht, statt zu
 * verschwinden.
 */
export function musicTypeLabel(value: string, t: TFunc): string {
  const fallback = MUSIC_TYPE_LABELS.get(value) ?? value
  return t(`musicTypes.${value}`, { defaultValue: fallback })
}

/**
 * Musikrichtungen als lesbare Liste — „Techno, House“ statt „technohouse“.
 *
 * React verkettet ein Array beim direkten Rendern ohne Trennzeichen; genau das
 * war der Fehler an den Anzeigestellen.
 */
export function formatMusicTypes(value: unknown, t: TFunc): string {
  return toStringArray(value)
    .map((v) => musicTypeLabel(v, t))
    .join(', ')
}

/**
 * Ein einzelner Schlüssel für Filter und Style-Zuordnungen.
 *
 * Wo bisher `event.musicType || event.category` stand, liefert ein Array-Feld
 * jetzt ein Array — als Objektschlüssel und im Vergleich mit einem String führt
 * das stillschweigend zu falschen Ergebnissen. Genommen wird deshalb der erste
 * Wert.
 */
export function primaryFieldKey(
  value: unknown,
  fallbackValue: unknown,
  fallback = 'Sonstige',
): string {
  return toStringArray(value)[0] || toStringArray(fallbackValue)[0] || fallback
}
