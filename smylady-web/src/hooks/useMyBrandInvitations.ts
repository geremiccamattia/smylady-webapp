'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { brandService, type MyBrandInvitation } from '@/services/brand'

export const MY_BRAND_INVITATIONS_QUERY_KEY = ['brand', 'myInvitations'] as const

/**
 * Offene Einladungen des angemeldeten Kontos.
 *
 * Fragt nur, wenn das Konto sicher zu keiner Brand gehört: `standing` muss
 * 'none' sein, solange es unbekannt ist, bleibt die Anfrage aus. Die Liste
 * hängt am Fokus, damit eine neue Einladung ohne Neuladen erscheint. Die Route
 * erlaubt 20 Abrufe pro Minute; die staleTime bremst schnelle Tab-Wechsel.
 *
 * Eine abgeschaltete Anfrage behält ihre Daten im Cache, deshalb hier die leere Liste.
 */
export function useMyBrandInvitations() {
  const { user } = useAuth()
  const { standing } = useBrandProfile()
  const enabled = Boolean(user) && !user?.isBrand && standing === 'none'

  const query = useQuery<MyBrandInvitation[]>({
    queryKey: MY_BRAND_INVITATIONS_QUERY_KEY,
    queryFn: () => brandService.getMyInvitations(),
    enabled,
    retry: false,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  })

  return { invitations: enabled ? (query.data ?? []) : [] }
}
