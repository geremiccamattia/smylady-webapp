'use client'

/**
 * Geräte-Fingerprint gegen Mehrfachkonten beim Einladungsbonus.
 *
 * Datenminimierung (M4): Nicht mehr beim Laden der Seite per Hook, sondern
 * erst, wenn die Registrierung tatsächlich abgeschickt wird — wer das Formular
 * nur ansieht oder sich anmeldet, wird nicht vermessen. Beim Login wird gar
 * kein Fingerprint erhoben.
 *
 * Liefert null, wenn die Bibliothek scheitert; die Registrierung läuft dann
 * ohne Fingerprint weiter.
 */
export async function getFingerprint(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default
    // monitoring: false — sonst schickt die Bibliothek bei einem Teil der Aufrufe
    // einen Statistik-Ping an m1.openfpcdn.io. Der hat für uns keine Funktion und
    // ist ein Aufruf an einen Dritten; er steht auch nicht in der CSP (next.config.ts).
    const fp = await FingerprintJS.load({ monitoring: false })
    const result = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('FingerprintJS failed:', error)
    return null
  }
}
