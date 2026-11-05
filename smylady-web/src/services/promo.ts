'use client'

/**
 * QR-Code zum Aufhängen auf dem Event und Rabattcode des Veranstalters.
 *
 * Der Veranstalter hinterlegt im Profil einen Rabattcode (nur Anzeige, kein
 * Rabatt im Ticketkauf). Jedes freigegebene Event hat einen QR-Code, der zu
 * /qr/<token> führt: ohne Login, mit Event und Rabattcode. Ohne Rabattcode
 * zeigt die Seite nur das Event. Das druckfertige PDF kommt vom Backend über
 * einen kurzlebigen Link (wie die Belege, siehe billing.ts).
 */

import { apiClient, publicClient } from './api'

export const PROMO_LIMITS = { promoCode: 40, promoText: 200 } as const

/** Query-Keys, gemeinsam für Profil, QR-Dialog und App-Screens */
export const PROMO_CODE_QUERY_KEY = ['promo', 'me'] as const
export const eventQrKey = (eventId: string) => ['promo', 'event', eventId] as const

export interface PromoCode {
  promoCode: string
  promoText: string
}

export interface EventQrState {
  eventId: string
  status: string
  /** Erst nach der Freigabe gibt es den QR-Code. */
  available: boolean
  token: string | null
  url: string | null
  hasPromoCode: boolean
}

export interface PromoPosterLink {
  url: string
  expiresAt: string
}

export interface PublicPromoPage {
  event: {
    id: string
    name: string
    /** z. B. /event/sommerfest-db35ad34 */
    path: string
    eventStartTime: string | null
    eventEndTime: string | null
    locationName: string
    locationType: string
    imageUrl: string | null
    status: string
  }
  organizer: { id: string; name: string; profileImage: string | null; profileImageThumbnailUrl: string | null }
  promo: { code: string; text: string } | null
}

const unwrap = <T>(response: { data?: { data?: T } & T }): T =>
  (response.data?.data ?? response.data) as T

export const promoService = {
  async getMyPromoCode(): Promise<PromoCode> {
    return unwrap<PromoCode>(await apiClient.get('/promo/me'))
  },

  async updateMyPromoCode(input: PromoCode): Promise<PromoCode> {
    return unwrap<PromoCode>(await apiClient.put('/promo/me', input))
  },

  async getEventQr(eventId: string): Promise<EventQrState> {
    return unwrap<EventQrState>(await apiClient.get(`/promo/events/${encodeURIComponent(eventId)}`))
  },

  async getPosterLink(eventId: string): Promise<PromoPosterLink> {
    return unwrap<PromoPosterLink>(
      await apiClient.get(`/promo/events/${encodeURIComponent(eventId)}/poster-link`),
    )
  },

  /** Ohne Login — die Seite nach dem Scan. */
  async getPublicPage(token: string): Promise<PublicPromoPage> {
    return unwrap<PublicPromoPage>(await publicClient.get(`/promo/public/${encodeURIComponent(token)}`))
  },
}

/** Fehlermeldung des Backends oder ein Ersatztext. */
export function readPromoError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data
  const message = data?.message
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  return typeof message === 'string' && message ? message : fallback
}
