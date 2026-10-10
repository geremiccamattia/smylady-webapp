'use client'

import axios from 'axios'
import { apiClient } from './api'

/**
 * Brand-Seite des Brand-Creator-Systems: eigenes Profil und eigene Aufträge.
 *
 * Alle Routen ausser GET/PATCH /brands/me verlangen ein AKTIVES Brand-Profil
 * (BrandGuard im Backend). Eine frisch registrierte Brand steht auf 'pending'
 * und bekommt bis zur Freischaltung im Admin-Panel überall 403. Das Profil
 * selbst lässt sich in jedem Status lesen; die Seiten entscheiden deshalb
 * über den Profilstatus (useBrandProfile), nicht über den 403.
 *
 * Wichtig: 403 darf NICHT wie 401 behandelt werden. Der Response-Interceptor
 * in api.ts meldet nur bei 401 ab — ein 403 fällt dort unberührt durch.
 */

// ───────────────────────────────────────────────────────────────
// Typen
// ───────────────────────────────────────────────────────────────

export type BrandProfileStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'suspended'

export interface BrandProfile {
  id: string
  status: BrandProfileStatus
  companyName: string
  contactName: string
  contactEmail: string
  contactPosition: string
  industry: string
  logoUrl: string
  website: string
  instagram: string
  tiktok: string
  otherLink: string
  description: string
  createdAt: string
}

export interface UpdateBrandProfilePayload {
  companyName?: string
  contactPerson?: { name: string; email: string; position?: string }
  industry?: string
  logoUrl?: string
  website?: string
  socialLinks?: { instagram?: string; tiktok?: string; other?: string }
  description?: string
}

export type BrandOrderStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'offer_sent'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export const DELIVERABLE_TYPES = ['reel', 'tiktok', 'feed_post', 'story', 'youtube_video', 'photo', 'other'] as const
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number]

export const DELIVERABLE_PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Sonstige'] as const
export type DeliverablePlatform = (typeof DELIVERABLE_PLATFORMS)[number]

export const AUDIENCE_GENDERS = ['all', 'female', 'male', 'diverse'] as const
export type AudienceGender = (typeof AUDIENCE_GENDERS)[number]

export interface BrandOrderDeliverable {
  type: DeliverableType
  quantity: number
  platform?: DeliverablePlatform
  notes?: string
}

/**
 * Was die Brand beim Anlegen oder Ändern eines Auftrags schickt. Entspricht
 * CreateBrandOrderDto im Backend; Datumsfelder als ISO-Strings.
 */
export interface BrandOrderPayload {
  title: string
  goal: string
  budget: number
  eventDetails: {
    name: string
    date: string
    endDate?: string
    locationName?: string
    description?: string
  }
  deliverables: BrandOrderDeliverable[]
  // Die drei optionalen Angaben kennen drei Zustände: Wert, weggelassen
  // (unverändert) und null (leeren). Beim Bearbeiten eines Entwurfs muss das
  // Formular null schicken, sonst fällt undefined im JSON weg und das Backend
  // behält den alten Wert.
  targetAudience?: {
    ageFrom?: number
    ageTo?: number
    gender?: AudienceGender
    region?: string
    interests?: string[]
  } | null
  usageRights?: { brandMayReuse?: boolean; notes?: string } | null
  publishDeadline?: string | null
  approvalRequired?: boolean
}

/**
 * Ein vorgeschlagener Creator aus Sicht der Brand.
 *
 * Ohne Freigabe (brandVisibilityConsent) liefert das Backend nur die ID und
 * einen Hinweis — die Brand erfährt dann nicht, wer dahintersteht. Eine
 * Vergütung ist nie dabei; die Brand zahlt den Angebotspreis.
 */
export interface ProposedCreatorCard {
  creatorUserId: string
  released: boolean
  name: string
  profileImage: string
  city: string
  categories: string[]
  channels: { platform: string; username: string; url?: string; followerRange?: string }[]
  portfolioLinks: string[]
  bio: string
}

export interface BrandOrder {
  id: string
  status: BrandOrderStatus
  title: string
  goal: string
  budget: number
  eventName: string
  eventDate: string
  eventEndDate: string
  eventLocation: string
  eventDescription: string
  deliverables: BrandOrderDeliverable[]
  audienceAgeFrom: number | null
  audienceAgeTo: number | null
  audienceGender: AudienceGender
  audienceRegion: string
  audienceInterests: string[]
  brandMayReuse: boolean
  usageNotes: string
  publishDeadline: string
  approvalRequired: boolean
  submittedAt: string
  statusChangedAt: string
  offerPrice: number | null
  offerNotes: string
  offerSentAt: string
  proposedCreators: ProposedCreatorCard[]
  eventId: string
  createdAt: string
}

export interface EventVisibilityResult {
  eventId: string
  visibility: 'public' | 'selected'
  /** Öffentlich, aber noch nicht in der Eventsuche: Die Freigabe durch uns steht aus. */
  approvalPending: boolean
}

// ───────────────────────────────────────────────────────────────
// Mapping — tolerant gegenüber fehlenden Feldern
// ───────────────────────────────────────────────────────────────

const str = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value)
const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const numOrNull = (value: unknown): number | null =>
  value === null || value === undefined || value === ''
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null
const idOf = (value: unknown): string =>
  value && typeof value === 'object' ? str((value as { _id?: unknown })._id) : str(value)

/** Das Backend antwortet je nach Endpunkt mit oder ohne data-Hülle. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = (response: { data?: any }): any => response.data?.data ?? response.data

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBrandProfile(raw: any): BrandProfile {
  return {
    id: str(raw?._id || raw?.id),
    status: (raw?.status || 'pending') as BrandProfileStatus,
    companyName: str(raw?.companyName),
    contactName: str(raw?.contactPerson?.name),
    contactEmail: str(raw?.contactPerson?.email),
    contactPosition: str(raw?.contactPerson?.position),
    industry: str(raw?.industry),
    logoUrl: str(raw?.logoUrl),
    website: str(raw?.website),
    instagram: str(raw?.socialLinks?.instagram),
    tiktok: str(raw?.socialLinks?.tiktok),
    otherLink: str(raw?.socialLinks?.other),
    description: str(raw?.description),
    createdAt: str(raw?.createdAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProposedCreator(raw: any): ProposedCreatorCard {
  // Ohne Freigabe kommt nur { creatorUserId, notice } — kein Name, kein Bild.
  const released = !raw?.notice && Boolean(raw?.name || raw?.channels || raw?.bio)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channels: any[] = Array.isArray(raw?.channels) ? raw.channels : []
  return {
    creatorUserId: idOf(raw?.creatorUserId),
    released,
    name: str(raw?.name),
    profileImage: str(raw?.profileImageThumbnailUrl || raw?.profileImage),
    city: str(raw?.city),
    categories: Array.isArray(raw?.categories) ? raw.categories.map(str) : [],
    channels: channels.map((channel) => ({
      platform: str(channel?.platform),
      username: str(channel?.username),
      url: str(channel?.url) || undefined,
      followerRange: str(channel?.followerRange) || undefined,
    })),
    portfolioLinks: Array.isArray(raw?.portfolioLinks) ? raw.portfolioLinks.map(str) : [],
    bio: str(raw?.bio),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBrandOrder(raw: any): BrandOrder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deliverables: any[] = Array.isArray(raw?.deliverables) ? raw.deliverables : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposed: any[] = Array.isArray(raw?.proposedCreators) ? raw.proposedCreators : []
  return {
    id: str(raw?._id || raw?.id),
    status: (raw?.status || 'draft') as BrandOrderStatus,
    title: str(raw?.title),
    goal: str(raw?.goal),
    budget: num(raw?.budget),
    eventName: str(raw?.eventDetails?.name),
    eventDate: str(raw?.eventDetails?.date),
    eventEndDate: str(raw?.eventDetails?.endDate),
    eventLocation: str(raw?.eventDetails?.locationName),
    eventDescription: str(raw?.eventDetails?.description),
    deliverables: deliverables.map((entry) => ({
      type: (str(entry?.type) || 'other') as DeliverableType,
      quantity: num(entry?.quantity) || 1,
      platform: (str(entry?.platform) || undefined) as DeliverablePlatform | undefined,
      notes: str(entry?.notes) || undefined,
    })),
    audienceAgeFrom: numOrNull(raw?.targetAudience?.ageFrom),
    audienceAgeTo: numOrNull(raw?.targetAudience?.ageTo),
    audienceGender: (str(raw?.targetAudience?.gender) || 'all') as AudienceGender,
    audienceRegion: str(raw?.targetAudience?.region),
    audienceInterests: Array.isArray(raw?.targetAudience?.interests)
      ? raw.targetAudience.interests.map(str)
      : [],
    brandMayReuse: Boolean(raw?.usageRights?.brandMayReuse),
    usageNotes: str(raw?.usageRights?.notes),
    publishDeadline: str(raw?.publishDeadline),
    approvalRequired: Boolean(raw?.approvalRequired),
    submittedAt: str(raw?.submittedAt),
    statusChangedAt: str(raw?.statusChangedAt),
    offerPrice: numOrNull(raw?.offer?.price),
    offerNotes: str(raw?.offer?.notes),
    offerSentAt: str(raw?.offer?.sentAt),
    proposedCreators: proposed.map(mapProposedCreator),
    eventId: idOf(raw?.eventId),
    createdAt: str(raw?.createdAt),
  }
}

// ───────────────────────────────────────────────────────────────
// Service
// ───────────────────────────────────────────────────────────────

export const brandService = {
  /** Eigenes Profil, in jedem Status. 404, wenn keins existiert. */
  async getMyProfile(): Promise<BrandProfile> {
    const response = await apiClient.get('/brands/me')
    return mapBrandProfile(unwrap(response))
  },

  async updateMyProfile(payload: UpdateBrandProfilePayload): Promise<BrandProfile> {
    const response = await apiClient.patch('/brands/me', payload)
    return mapBrandProfile(unwrap(response))
  },

  /** Alle eigenen Aufträge, neueste zuerst. Die Creator-Vorschläge sind hier nur IDs. */
  async getMyOrders(): Promise<BrandOrder[]> {
    const response = await apiClient.get('/brand-orders/me')
    const data = unwrap(response)
    return Array.isArray(data) ? data.map(mapBrandOrder) : []
  },

  /** Ein Auftrag mit den öffentlichen Profilen der vorgeschlagenen Creator. */
  async getMyOrder(id: string): Promise<BrandOrder> {
    const response = await apiClient.get(`/brand-orders/${id}`)
    return mapBrandOrder(unwrap(response))
  },

  /** Legt einen Entwurf an. Eingereicht wird erst über submitOrder(). */
  async createOrder(payload: BrandOrderPayload): Promise<BrandOrder> {
    const response = await apiClient.post('/brand-orders', payload)
    return mapBrandOrder(unwrap(response))
  },

  /** Nur im Status 'draft'; sonst 409. */
  async updateOrder(id: string, payload: Partial<BrandOrderPayload>): Promise<BrandOrder> {
    const response = await apiClient.patch(`/brand-orders/${id}`, payload)
    return mapBrandOrder(unwrap(response))
  },

  async submitOrder(id: string): Promise<BrandOrder> {
    const response = await apiClient.post(`/brand-orders/${id}/submit`)
    return mapBrandOrder(unwrap(response))
  },

  /**
   * Nimmt das Angebot an. Das Backend legt danach Event und Creator-Auftrag
   * an und setzt 'confirmed'. Nur im Status 'offer_sent'; sonst 409.
   */
  async acceptOffer(id: string): Promise<BrandOrder> {
    const response = await apiClient.post(`/brand-orders/${id}/accept-offer`)
    return mapBrandOrder(unwrap(response))
  },

  /** 'public' heisst Explore (nach Freigabe durch uns), 'selected' nur die Creator. */
  async setEventVisibility(id: string, visibility: 'public' | 'selected'): Promise<EventVisibilityResult> {
    const response = await apiClient.patch(`/brand-orders/${id}/event/visibility`, { visibility })
    const data = unwrap(response) ?? {}
    return {
      eventId: idOf(data.eventId),
      visibility: data.visibility === 'public' ? 'public' : 'selected',
      approvalPending: Boolean(data.approvalPending),
    }
  },
}

/** 404 von GET /brands/me: Dieses Konto hat kein Brand-Profil. */
export function isBrandNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

/** Die Fehlermeldung des Backends, sonst der Fallback. */
export function readBrandError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; msg?: string } | undefined
    return data?.message || data?.msg || fallback
  }
  return fallback
}
