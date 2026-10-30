'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  brandService,
  isBrandNotFound,
  type BrandMembershipRole,
  type BrandProfile,
  type BrandTeam,
} from '@/services/brand'

export const BRAND_PROFILE_QUERY_KEY = ['brand', 'me'] as const
export const BRAND_TEAM_QUERY_KEY = ['brand', 'team'] as const

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
 *
 * Die Antwort gilt für Inhaber und Mitglieder gleichermassen. `role` sagt,
 * was davon dieses Konto ist. `isOwner` steuert die Inhaber-Aktionen und ist
 * bei einer gesperrten Brand falsch; die Profilseite, die auch eine gesperrte
 * Brand bearbeiten darf, liest deshalb `role`.
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

  const role: BrandMembershipRole | null = query.data?.membershipRole ?? null
  const isOwner = role === 'owner' && (standing === 'active' || standing === 'pending')

  return {
    profile: query.data ?? null,
    standing,
    role,
    isOwner,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

/** Mitglieder und Einladungen der eigenen Brand. Lädt erst, wenn es ein Profil gibt. */
export function useBrandTeam() {
  const { profile } = useBrandProfile()

  return useQuery<BrandTeam>({
    queryKey: BRAND_TEAM_QUERY_KEY,
    queryFn: () => brandService.getTeam(),
    enabled: Boolean(profile),
    retry: false,
  })
}

/**
 * Nach jeder Team-Änderung aufrufen.
 *
 * `account: true` nach Inhaberwechsel, Austritt und Entfernen: Dann ändert sich
 * auch, was das Konto darf. Deshalb zusätzlich die Nutzerdaten (isBrand in
 * GET /users/me) und alles unter ['brand'], damit keine Aufträge der alten
 * Rolle im Cache bleiben.
 */
export function useRefreshBrandTeam() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()

  return useCallback(
    async ({ account = false }: { account?: boolean } = {}) => {
      if (account) {
        await Promise.all([queryClient.invalidateQueries({ queryKey: ['brand'] }), refreshUser()])
        return
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: BRAND_TEAM_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: BRAND_PROFILE_QUERY_KEY }),
      ])
    },
    [queryClient, refreshUser],
  )
}
