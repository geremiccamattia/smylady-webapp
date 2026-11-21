'use client'

import { authService } from '@/services/auth'
import { creatorAreaService, isCreatorNotFound } from '@/services/creator'
import { isSafeInternalPath } from '@/lib/navigation'

/** Basis zum Auflösen relativer Pfade; nur der Vergleich des Origins zählt. */
const RESOLVE_BASE = 'http://localhost'

/**
 * Der Wert roh sowie ein- und zweimal dekodiert. Ein %-Fehler (z. B. ein
 * einzelnes `%` in einer Suchanfrage) beendet nur das weitere Dekodieren —
 * die bis dahin erhaltenen Fassungen werden trotzdem geprüft.
 */
function decodedVariants(raw: string): string[] {
  const variants = [raw]
  let current = raw
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      variants.push(decoded)
      current = decoded
    } catch {
      break
    }
  }
  return variants
}

/**
 * Ein Rücksprungziel aus `?next=…`, aber nur, wenn es eine eigene Seite ist.
 * Alles andere wird ignoriert (der Aufrufer fällt auf sein Standardziel zurück).
 *
 * - Roh und dekodiert: ein absoluter Pfad mit genau einem führenden `/`,
 *   ohne Backslash und ohne Steuerzeichen (U+0000–U+001F, U+007F). Browser
 *   entfernen Tab, Zeilenumbruch und Wagenrücklauf aus URLs — aus
 *   `/%09/fremd.example` würde sonst `//fremd.example` (isSafeInternalPath).
 * - Aufgelöst gegen eine feste Basis: Der Origin bleibt derselbe, und der
 *   Pfad beginnt mit genau einem `/`.
 * - Nicht wieder die Login- oder Registrierseite.
 *
 * Zurück kommt der ursprüngliche relative Pfad.
 */
export function safeNextPath(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw) return undefined
  if (!decodedVariants(raw).every(isSafeInternalPath)) return undefined
  if (/^\/(en\/)?(login|register)(\/|\?|$)/.test(raw)) return undefined

  try {
    const resolved = new URL(raw, RESOLVE_BASE)
    if (resolved.origin !== RESOLVE_BASE) return undefined
    if (!resolved.pathname.startsWith('/') || resolved.pathname.startsWith('//')) return undefined
  } catch {
    return undefined
  }

  return raw
}

/**
 * Wohin ein Konto nach dem Login gehört.
 *
 *   `next` (Rücksprung, z. B. der Link aus einer Angebotsmail) → dorthin
 *   Brand (isBrand aus GET /users/me)                          → /brand
 *   aktiver Creator (status aus GET /creators/me)              → /creator
 *   alle anderen                                               → /explore
 *
 * Nur ein AKTIVES Creator-Profil führt in den Creator-Bereich. Pausierte,
 * gesperrte oder noch nicht aktive Profile landen auf /explore — sonst sähe
 * der Nutzer bei jedem Login zuerst den Sperrbildschirm.
 *
 * Alle Abfragen sind unkritisch: Scheitert eine, landet der Nutzer wie
 * bisher auf /explore. Der Pfad kommt ohne Sprachpräfix zurück; der Aufrufer
 * legt es mit useLocalePath() an (ein `next` trägt es schon in sich, und
 * localePath() verdoppelt es nicht).
 */
export async function resolvePostLoginPath(next?: string | null): Promise<string> {
  const target = safeNextPath(next)
  if (target) return target

  try {
    const me = await authService.getCurrentUser()
    if (me?.isBrand) return '/brand'
  } catch {
    // Kein Brand-Kennzeichen ermittelbar — weiter mit dem Creator-Stand.
  }

  try {
    const profile = await creatorAreaService.getMyProfile()
    if (profile?.status === 'active') return '/creator'
  } catch (error) {
    if (!isCreatorNotFound(error)) {
      // Netz- oder Serverfehler — Standardziel, kein Blocker.
    }
  }

  return '/explore'
}
