'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { creatorAreaService, isCreatorNotFound, type CreatorProfile } from '@/services/creator'

export const CREATOR_PROFILE_QUERY_KEY = ['creator', 'me'] as const

/**
 * Wo das angemeldete Konto im Creator-Bereich steht — Gegenstück zu
 * useBrandProfile.
 *
 *   'none'     — kein Creator-Profil (404): Bewerbung läuft über /creator/apply
 *   'active'   — Profil aktiv, Anfragen sichtbar
 *   'pending'  — Profil angelegt, aber noch nicht aktiv
 *   'blocked'  — pausiert, abgelehnt oder gesperrt
 *   undefined  — noch unbekannt (lädt, nicht angemeldet, Netzfehler)
 */
export type CreatorProfileStanding = 'none' | 'pending' | 'active' | 'blocked'

export function useCreatorProfile() {
  const { user, isLoading: authLoading } = useAuth()

  const query = useQuery<CreatorProfile | null>({
    queryKey: CREATOR_PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        return await creatorAreaService.getMyProfile()
      } catch (error) {
        if (isCreatorNotFound(error)) return null
        throw error
      }
    },
    enabled: Boolean(user),
    retry: false,
  })

  let standing: CreatorProfileStanding | undefined
  if (query.isSuccess) {
    if (!query.data) standing = 'none'
    else if (query.data.status === 'active') standing = 'active'
    else if (query.data.status === 'pending') standing = 'pending'
    else standing = 'blocked'
  } else if (!authLoading && !user) {
    standing = 'none'
  }

  return {
    profile: query.data ?? null,
    standing,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
