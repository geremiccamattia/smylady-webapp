'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { isTutorialsForbidden, tutorialsService, type Tutorial } from '@/services/tutorials'

/**
 * Lädt die Video-Tutorials und beantwortet zugleich, ob es sie für diesen
 * Nutzer überhaupt gibt.
 *
 * `hasAccess` ist bewusst dreiwertig:
 *   true      — 200, die Liste liegt vor
 *   false     — 403, kein Zugang (oder gar nicht angemeldet)
 *   undefined — noch unbekannt: Anfrage läuft, oder sie ist an etwas anderem
 *               gescheitert (Netz, 500)
 *
 * Aufrufer dürfen den Bereich NUR bei `true` zeigen. Alles andere — auch der
 * unklare Fall — bleibt verborgen: Ein Eintrag, der bei einem Netzfehler
 * kurz aufblitzt, verriete bereits, dass es ihn gibt.
 *
 * `retry: false` ist Absicht. Ein 403 ist kein vorübergehender Fehler, und ein
 * Wiederholungslauf würde den Zustand nur verzögert klären.
 */
export function useTutorials() {
  const { user, isLoading: authLoading } = useAuth()

  const query = useQuery<Tutorial[]>({
    queryKey: ['tutorials'],
    queryFn: () => tutorialsService.getTutorials(),
    // Ohne angemeldeten Nutzer gibt es nichts zu fragen; der Endpoint liefe in
    // einen 401 und damit über die Abmelde-Logik des Interceptors.
    enabled: Boolean(user),
    retry: false,
    // Der Zugang wird von uns von Hand gesetzt und ändert sich nicht im Minutentakt.
    staleTime: 5 * 60 * 1000,
  })

  const forbidden = isTutorialsForbidden(query.error)

  /*
   * `authLoading` muss hier mit hinein, sonst fällt die Entscheidung zu früh.
   * AuthContext liest Token und Nutzer erst in einem Effect aus dem
   * localStorage — beim Prerender und im ersten Client-Render ist `user` also
   * immer null. Ohne diese Bedingung stünde `hasAccess` schon zur Build-Zeit auf
   * false, und die Route würde statisch als „nicht gefunden“ vorgerendert.
   */
  let hasAccess: boolean | undefined
  if (query.isSuccess) hasAccess = true
  else if (forbidden) hasAccess = false
  else if (!authLoading && !user) hasAccess = false

  return {
    tutorials: query.data ?? [],
    hasAccess,
    isLoading: authLoading || query.isLoading,
  }
}
