'use client'

import { authService } from '@/services/auth'
import { creatorService } from '@/services/creator'

/**
 * Wohin ein Konto nach dem Login gehört.
 *
 *   Brand (isBrand aus GET /users/me)         → /brand
 *   Creator (hasCreatorProfile aus my-application) → /creator
 *   alle anderen                               → /explore
 *
 * Beide Abfragen sind unkritisch: Scheitert eine, landet der Nutzer wie
 * bisher auf /explore. Der Pfad kommt ohne Sprachpräfix zurück — src/proxy.ts
 * hängt es anhand des Sprach-Cookies an.
 */
export async function resolvePostLoginPath(): Promise<string> {
  try {
    const me = await authService.getCurrentUser()
    if (me?.isBrand) return '/brand'
  } catch {
    // Kein Brand-Kennzeichen ermittelbar — weiter mit dem Creator-Stand.
  }

  try {
    const application = await creatorService.getMyApplication()
    if (application?.hasCreatorProfile) return '/creator'
  } catch {
    // Kein Creator-Stand ermittelbar — Standardziel.
  }

  return '/explore'
}
