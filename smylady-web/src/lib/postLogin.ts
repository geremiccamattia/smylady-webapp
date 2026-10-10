'use client'

import { authService } from '@/services/auth'
import { creatorAreaService, isCreatorNotFound } from '@/services/creator'

/**
 * Ein Rücksprungziel aus `?next=…`, aber nur, wenn es eine eigene Seite ist:
 * absoluter Pfad, keine Protokoll-relative URL (`//fremd.example`), nicht
 * wieder die Login-Seite. Alles andere wird ignoriert.
 */
export function safeNextPath(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return undefined
  if (/^\/(en\/)?(login|register)(\/|\?|$)/.test(raw)) return undefined
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
