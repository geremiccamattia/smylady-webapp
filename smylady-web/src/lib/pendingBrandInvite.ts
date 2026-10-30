'use client'

/**
 * Der Token einer Brand-Einladung, solange sie nicht entschieden ist.
 *
 * Wer die Einladung als Gast öffnet, muss sich erst anmelden oder registrieren.
 * Der Token geht dabei bewusst NICHT über ?next= an den Login: Dort liefe er
 * als Teil der Adresse durch Google-Login und Analyse-Skripte. Stattdessen
 * merkt ihn sich die Seite hier, und useResumeBrandInvite führt danach zurück.
 *
 * Gelöscht wird erst nach Annahme oder Ablehnung (oder wenn die Einladung nicht
 * mehr gültig ist), spätestens nach sieben Tagen — so lange gilt eine Einladung
 * ohnehin höchstens. Ist der Speicher gesperrt, passiert nichts: Die Person
 * klickt den Link aus der Mail dann nach dem Login noch einmal.
 */

const STORAGE_KEY = 'pendingBrandInvite'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** true, wenn der Token gespeichert ist. */
export function savePendingBrandInvite(token: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, savedAt: Date.now() }))
    return true
  } catch {
    return false
  }
}

export function readPendingBrandInvite(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: unknown; savedAt?: unknown }
    const fresh = typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt < MAX_AGE_MS
    if (typeof parsed.token === 'string' && parsed.token && fresh) return parsed.token
    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

/** Merker von useResumeBrandInvite: pro Browser-Sitzung nur ein Rücksprung. */
const RESUMED_KEY = 'pendingBrandInviteResumed'

/** Darf useResumeBrandInvite jetzt zurückführen? Setzt den Merker gleich mit. */
export function claimBrandInviteResume(): boolean {
  try {
    if (sessionStorage.getItem(RESUMED_KEY) === '1') return false
    sessionStorage.setItem(RESUMED_KEY, '1')
    return true
  } catch {
    // Ohne sessionStorage lieber kein Rücksprung als einer bei jeder Seite.
    return false
  }
}

/** Nach dem Abmelden vom falschen Konto: Das richtige Konto soll wieder zurückkommen. */
export function releaseBrandInviteResume(): void {
  try {
    sessionStorage.removeItem(RESUMED_KEY)
  } catch {
    // Dann bleibt nur der Link aus der Mail.
  }
}

export function clearPendingBrandInvite(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nichts zu tun: Der Eintrag läuft nach sieben Tagen von selbst ab.
  }
}
