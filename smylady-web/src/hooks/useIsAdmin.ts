'use client'

import { useAuth } from '@/contexts/AuthContext'

/**
 * Plattformweite Admin-Rechte des eingeloggten Nutzers.
 *
 * Schaltet in der Oberfläche Sonderfunktionen frei: Gratis-Spotlight, Gratis-Boost
 * samt Admin-Pause und die Verwaltungsknöpfe auf fremden Eventseiten.
 *
 * Bis August 2026 stand an jeder dieser drei Stellen wortgleich eine hartkodierte
 * Liste zweier E-Mail-Adressen. Dass es drei Kopien waren, hat die Liste so lange
 * überleben lassen — deshalb liegt die Prüfung jetzt nur noch hier.
 *
 * Zu beachten: Das ist eine reine Anzeige-Entscheidung. Die tatsächliche
 * Autorisierung trifft das Backend; ein ausgeblendeter Button schützt keinen
 * Endpoint.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.role === 'admin'
}
