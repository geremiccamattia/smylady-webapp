'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  creatorService,
  resolveCreatorStanding,
  type CreatorStanding,
} from '@/services/creator'

/**
 * Wo das angemeldete Konto im Creator-Ablauf steht.
 *
 * `standing` ist undefined, solange die Antwort nicht vorliegt — beim Laden,
 * ohne angemeldeten Nutzer, oder wenn die Anfrage gescheitert ist. Aufrufer
 * zeigen in dem Fall nichts; ein Eintrag, der bei einem Netzfehler kurz als
 * „Creator werden" aufblitzt, wäre für ein Mitglied irreführend.
 *
 * `retry: false` ist Absicht: Der Endpunkt antwortet entweder sofort oder
 * gar nicht, ein Wiederholungslauf würde den Zustand nur verzögert klären.
 */
export function useCreatorStanding() {
  const { user, isLoading: authLoading } = useAuth()

  const query = useQuery({
    queryKey: ['creator', 'my-application'],
    queryFn: () => creatorService.getMyApplication(),
    // Ohne Nutzer liefe der Endpunkt in einen 401 und damit in die
    // Abmelde-Logik des Interceptors.
    enabled: Boolean(user),
    retry: false,
  })

  const standing: CreatorStanding | undefined = query.data
    ? resolveCreatorStanding(query.data)
    : undefined

  return {
    standing,
    isLoading: authLoading || query.isLoading,
  }
}
