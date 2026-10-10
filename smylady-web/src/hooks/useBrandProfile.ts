'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { brandService, isBrandNotFound, type BrandProfile } from '@/services/brand'

export const BRAND_PROFILE_QUERY_KEY = ['brand', 'me'] as const

/**
 * Wo das angemeldete Konto im Brand-Ablauf steht.
 *
 *   'none'     — kein Brand-Profil (404): Konto ist keine Marke
 *   'pending'  — registriert, wartet auf Freischaltung
 *   'active'   — freigeschaltet, Aufträge möglich
 *   'blocked'  — pausiert, abgelehnt oder gesperrt
 *   undefined  — noch unbekannt (lädt, nicht angemeldet, Netzfehler)
 *
 * GET /brands/me funktioniert in jedem Profilstatus; nur die Auftragsrouten
 * hängen am BrandGuard. Deshalb reicht diese eine Anfrage, um die Seite zu
 * entscheiden.
 */
export type BrandStanding = 'none' | 'pending' | 'active' | 'blocked'

export function useBrandProfile() {
  const { user, isLoading: authLoading } = useAuth()

  const query = useQuery<BrandProfile | null>({
    queryKey: BRAND_PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        return await brandService.getMyProfile()
      } catch (error) {
        // Kein Profil ist ein regulärer Zustand, kein Fehler.
        if (isBrandNotFound(error)) return null
        throw error
      }
    },
    // Ohne Nutzer liefe der Endpunkt in einen 401 und damit in die
    // Abmelde-Logik des Interceptors.
    enabled: Boolean(user),
    retry: false,
  })

  let standing: BrandStanding | undefined
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
