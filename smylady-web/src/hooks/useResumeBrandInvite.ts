'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import {
  claimBrandInviteResume,
  clearPendingBrandInvite,
  readPendingBrandInvite,
} from '@/lib/pendingBrandInvite'

/**
 * Diese Seiten laufen nicht unter: /interests ist der letzte Schritt der
 * Registrierung und /creator/apply das Ziel des Google-Wegs mit angehakter
 * Creator-Bewerbung. Beide liegen in der Route-Gruppe (app); danach führt die
 * nächste Seite zurück zur Einladung.
 */
const NOT_ON = /^\/(brand\/invite|interests|creator\/apply)(\/|$)/

/**
 * Führt nach Login oder Registrierung zur offenen Brand-Einladung zurück.
 *
 * Läuft im Layout der Route-Gruppe (app), also dort, wo alle Wege nach dem Login
 * ankommen: E-Mail, Google, Registrierung über /interests. Der Login selbst
 * bleibt unberührt. Der Token steht auch hier nicht in der Adresse, die
 * Einladungsseite liest ihn aus dem Speicher.
 *
 * Pro Browser-Sitzung nur einmal, sonst käme niemand mehr von der Einladung weg.
 *
 * Wer schon zu einer Brand gehört (etwa nach der Annahme im Banner), kann keine
 * Einladung mehr annehmen: Der Eintrag fällt weg, die Rückkehr unterbleibt.
 */
export function useResumeBrandInvite() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const localePath = useLocalePath()
  const { profile, standing, isError } = useBrandProfile()
  const belongsToBrand = Boolean(profile)
  // Scheitert die Abfrage, bleibt es beim Rücksprung: Die Einladungsseite meldet das Nötige.
  const standingKnown = standing !== undefined || isError

  useEffect(() => {
    if (isLoading || !user) return
    if (NOT_ON.test(pathname.replace(/^\/en(?=\/|$)/, ''))) return
    if (!standingKnown || !readPendingBrandInvite()) return
    if (belongsToBrand) {
      clearPendingBrandInvite()
      return
    }
    if (!claimBrandInviteResume()) return

    router.replace(localePath('/brand/invite'))
    // localePath wechselt bei jedem Render die Referenz; es hängt am pathname.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, pathname, router, standingKnown, belongsToBrand])
}
