'use client'

import axios from 'axios'
import { apiClient, publicClient } from './api'

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
 *
 * Eine Brand kann mehrere Personen haben: Inhaber (owner) und Mitglieder
 * (member). GET /brands/me liefert das Profil der Brand für beide, die Rolle
 * steht in membership.role. Das Backend setzt die Rechte durch; die Seiten
 * zeigen sie nur an.
 */

// ───────────────────────────────────────────────────────────────
// Typen
// ───────────────────────────────────────────────────────────────

export type BrandProfileStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'suspended'

export type BrandMembershipRole = 'owner' | 'member'

export interface BrandProfile {
  id: string
  status: BrandProfileStatus
  /** Rolle des angemeldeten Kontos in dieser Brand. */
  membershipRole: BrandMembershipRole
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

export interface BrandTeamMember {
  userId: string
  name: string
  email: string
  profileImage: string
  profileImageThumbnailUrl: string
  role: BrandMembershipRole
  joinedAt: string
}

export type BrandInvitationStatus = 'pending' | 'expired'

export interface BrandInvitation {
  id: string
  email: string
  status: BrandInvitationStatus
  expiresAt: string
  lastSentAt: string
}

/** Antwort von Einladen und Erneut senden: Die Einladung steht, die Mail vielleicht nicht. */
export interface BrandInvitationSent extends BrandInvitation {
  mailSent: boolean
}

export interface BrandTeam {
  members: BrandTeamMember[]
  invitations: BrandInvitation[]
}

export type InvitationState = 'valid' | 'expired' | 'used' | 'revoked' | 'unknown'
const INVITATION_STATES: readonly string[] = ['valid', 'expired', 'used', 'revoked', 'unknown']

/** Vorschau ohne Login. Bei jedem ungültigen Zustand sind beide Angaben null. */
export interface InvitationPreview {
  state: InvitationState
  companyName: string | null
  maskedEmail: string | null
}

export interface AcceptedInvitation {
  brandId: string
  companyName: string
  role: BrandMembershipRole
}

/** Offene Einladung an die bestätigte Adresse des Kontos, ohne Token. */
export interface MyBrandInvitation {
  id: string
  companyName: string
  invitedByName: string
  expiresAt: string
}

/**
 * Was PATCH /brands/me entgegennimmt. Die optionalen Felder kennen drei
 * Zustände: Wert, weggelassen (unverändert) und null (leeren) — undefined
 * fiele im JSON weg und das Backend behielte den alten Wert.
 */
export interface UpdateBrandProfilePayload {
  companyName?: string
  contactPerson?: { name: string; email: string; position?: string }
  industry?: string
  logoUrl?: string | null
  website?: string | null
  socialLinks?: { instagram?: string; tiktok?: string; other?: string } | null
  description?: string | null
}

/**
 * Der Ablauf eines Auftrags:
 *   draft → submitted → in_review → creators_requested (wir fragen Creator
 *   nach ihrer Verfügbarkeit) → offer_sent (Angebot aus den Zusagen) →
 *   awaiting_payment (Brand bezahlt bei Stripe) → confirmed (bezahlt, Event
 *   und Buchung stehen) → completed. 'cancelled' aus jedem Zwischenstand.
 */
export type BrandOrderStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'creators_requested'
  | 'offer_sent'
  | 'awaiting_payment'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export type BrandPaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'refunded'
const PAYMENT_STATUSES: readonly string[] = ['pending', 'processing', 'paid', 'failed', 'expired', 'refunded']

/** Die Zahlung der Brand, soweit sie sie sehen soll: Stand, Betrag, Belege. */
export interface BrandOrderPayment {
  status: BrandPaymentStatus
  provider: 'stripe' | 'external'
  amount: number
  paidAt: string
  /** Wie Stripe die Zahlungsart nennt ('card', 'sepa_debit', 'customer_balance'); leer, bis bekannt. */
  paymentMethod: string
  /** Gehostete Rechnung bei Stripe und PDF, sobald die Zahlung durch ist. */
  invoiceUrl: string
  invoicePdfUrl: string
  receiptUrl: string
  refundedAt: string
  /** Woran es lag, wenn die Zahlung gescheitert ist. */
  failureReason: string
}

export const DELIVERABLE_TYPES = ['reel', 'tiktok', 'feed_post', 'story', 'youtube_video', 'photo', 'other'] as const
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number]

export const DELIVERABLE_PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Sonstige'] as const
export type DeliverablePlatform = (typeof DELIVERABLE_PLATFORMS)[number]

export const AUDIENCE_GENDERS = ['all', 'female', 'male', 'diverse'] as const
export type AudienceGender = (typeof AUDIENCE_GENDERS)[number]

/** Obergrenze für das Eventbild im Auftrag — dieselbe wie im Backend (Multer-Limit). */
export const EVENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024

export interface BrandOrderDeliverable {
  type: DeliverableType
  quantity: number
  platform?: DeliverablePlatform
  notes?: string
}

/**
 * Was die Brand beim Anlegen oder Ändern eines Auftrags schickt. Entspricht
 * CreateBrandOrderDto im Backend; Datumsfelder als ISO-Strings.
 *
 * Ein Entwurf braucht nur den Titel. Alles andere ist optional und wird erst
 * beim Einreichen (POST /:id/submit) vom Backend eingefordert. Geschickte
 * Felder müssen aber stimmen: Ein Datum muss ISO sein, ein Ende nach dem
 * Beginn liegen, eine Anzahl mindestens 1 sein.
 */
export interface BrandOrderPayload {
  title: string
  // Wie targetAudience unten: Wert, weggelassen (unverändert) oder null
  // (leeren). Beim Bearbeiten leert das Formular mit null, was die Brand
  // ausgeräumt hat; sonst bliebe der alte Wert im Backend stehen.
  goal?: string | null
  budget?: number | null
  eventDetails?: {
    name?: string
    date?: string
    endDate?: string
    locationName?: string
    description?: string
    // Aus der Adresssuche, nur wenn die Brand einen Vorschlag gewählt hat.
    // null leert die Koordinaten beim Bearbeiten (Ort wurde zu Freitext).
    coordinates?: { lat: number; lng: number } | null
  }
  deliverables?: BrandOrderDeliverable[]
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

/** Antwort eines Creators auf die Anfrage; entspricht AssignmentResponse im Creator-Bereich. */
export type CreatorResponse = 'pending' | 'accepted' | 'declined' | 'expired'
const CREATOR_RESPONSES: readonly string[] = ['pending', 'accepted', 'declined', 'expired']

/**
 * Ein vorgeschlagener Creator aus Sicht der Brand.
 *
 * Ohne Freigabe (brandVisibilityConsent) liefert das Backend nur die ID und
 * einen Hinweis — die Brand erfährt dann nicht, wer dahintersteht. Eine
 * Vergütung ist nie dabei; die Brand zahlt den Angebotspreis.
 *
 * `response` gibt es erst, sobald ein Creator-Auftrag existiert (ab
 * 'confirmed'); vorher null. Sie kommt auch für nicht freigegebene Creator.
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
  response: CreatorResponse | null
  respondedAt: string
}

export interface BrandOrder {
  id: string
  status: BrandOrderStatus
  title: string
  goal: string
  /** Budgetvorstellung der Brand; null, solange der Entwurf keines hat. */
  budget: number | null
  eventName: string
  eventDate: string
  eventEndDate: string
  eventLocation: string
  /** Nur gesetzt, wenn der Ort aus der Adresssuche kam; Freitext hat keine. */
  eventCoordinates: { lat: number; lng: number } | null
  eventDescription: string
  /**
   * Das Eventbild, das die Brand im Entwurf hochgeladen hat (POST
   * /brand-orders/:id/event-image). Pflicht zum Einreichen; wird beim
   * Annehmen des Angebots zum Bild des Events. Leer, solange keines da ist.
   */
  eventImageUrl: string
  eventImageThumbnailUrl: string
  eventImageFileName: string
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
  /** Bis wann die Brand annehmen und bezahlen kann; danach storniert das System. */
  offerExpiresAt: string
  proposedCreators: ProposedCreatorCard[]
  eventId: string
  createdAt: string
  /** Nur im Status 'cancelled': wer storniert hat, wann, und (optional) warum. */
  cancellation: { by: 'brand' | 'admin' | 'system'; reason: string; at: string } | null
  /** Zu-/Absagen der Creator, sobald ein Angebot vorliegt (nur die Besetzung). */
  responses: { accepted: number; declined: number; pending: number; expired: number } | null
  /** Die Zahlung, sobald die Brand den Checkout gestartet hat. */
  payment: BrandOrderPayment | null
  /** Nach der Zahlung: Stehen Event und Buchung schon? 'failed' heisst: wir holen es nach. */
  provisioning: 'pending' | 'done' | 'failed' | null
}

/** Was POST /brand-orders/:id/checkout liefert: die Stripe-Seite. */
export interface CheckoutStart {
  url: string
  sessionId: string
  expiresAt: string
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
/** { lat, lng } nur, wenn beides eine Zahl ist — sonst null. */
const coordinatesOrNull = (value: unknown): { lat: number; lng: number } | null => {
  if (!value || typeof value !== 'object') return null
  const lat = numOrNull((value as { lat?: unknown }).lat)
  const lng = numOrNull((value as { lng?: unknown }).lng)
  return lat === null || lng === null ? null : { lat, lng }
}

/** Das Backend antwortet je nach Endpunkt mit oder ohne data-Hülle. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrap = (response: { data?: any }): any => response.data?.data ?? response.data

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBrandProfile(raw: any): BrandProfile {
  return {
    id: str(raw?._id || raw?.id),
    status: (raw?.status || 'pending') as BrandProfileStatus,
    // Antworten ohne das Feld (PATCH /brands/me) stammen vom Inhaber.
    membershipRole: raw?.membership?.role === 'member' ? 'member' : 'owner',
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
    response: CREATOR_RESPONSES.includes(raw?.response) ? (raw.response as CreatorResponse) : null,
    respondedAt: str(raw?.respondedAt),
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
    budget: numOrNull(raw?.budget),
    eventName: str(raw?.eventDetails?.name),
    eventDate: str(raw?.eventDetails?.date),
    eventEndDate: str(raw?.eventDetails?.endDate),
    eventLocation: str(raw?.eventDetails?.locationName),
    eventCoordinates: coordinatesOrNull(raw?.eventDetails?.coordinates),
    eventDescription: str(raw?.eventDetails?.description),
    eventImageUrl: str(raw?.eventImage?.url),
    eventImageThumbnailUrl: str(raw?.eventImage?.thumbnailUrl),
    eventImageFileName: str(raw?.eventImage?.fileName),
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
    offerExpiresAt: str(raw?.offer?.expiresAt),
    proposedCreators: proposed.map(mapProposedCreator),
    eventId: idOf(raw?.eventId),
    createdAt: str(raw?.createdAt),
    cancellation:
      raw?.cancellation && typeof raw.cancellation === 'object'
        ? {
            by: raw.cancellation.by === 'admin' ? 'admin' : raw.cancellation.by === 'system' ? 'system' : 'brand',
            reason: str(raw.cancellation.reason),
            at: str(raw.cancellation.at),
          }
        : null,
    responses:
      raw?.responses && typeof raw.responses === 'object'
        ? {
            accepted: num(raw.responses.accepted),
            declined: num(raw.responses.declined),
            pending: num(raw.responses.pending),
            expired: num(raw.responses.expired),
          }
        : null,
    payment: mapPayment(raw?.payment),
    provisioning:
      raw?.provisioning?.status === 'pending' ||
      raw?.provisioning?.status === 'done' ||
      raw?.provisioning?.status === 'failed'
        ? raw.provisioning.status
        : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayment(raw: any): BrandOrderPayment | null {
  if (!raw || typeof raw !== 'object' || !PAYMENT_STATUSES.includes(raw.status)) return null
  return {
    status: raw.status as BrandPaymentStatus,
    provider: raw.provider === 'external' ? 'external' : 'stripe',
    amount: num(raw.amount),
    paidAt: str(raw.paidAt),
    paymentMethod: str(raw.paymentMethod),
    invoiceUrl: str(raw.invoiceUrl),
    invoicePdfUrl: str(raw.invoicePdfUrl),
    receiptUrl: str(raw.receiptUrl),
    refundedAt: str(raw.refundedAt),
    failureReason: str(raw.failureReason),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeamMember(raw: any): BrandTeamMember {
  return {
    userId: idOf(raw?.userId),
    name: str(raw?.name),
    email: str(raw?.email),
    profileImage: str(raw?.profileImage),
    profileImageThumbnailUrl: str(raw?.profileImageThumbnailUrl),
    role: raw?.role === 'owner' ? 'owner' : 'member',
    joinedAt: str(raw?.joinedAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvitation(raw: any): BrandInvitation {
  return {
    id: str(raw?.id || raw?._id),
    email: str(raw?.email),
    status: raw?.status === 'expired' ? 'expired' : 'pending',
    expiresAt: str(raw?.expiresAt),
    lastSentAt: str(raw?.lastSentAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvitationSent(raw: any): BrandInvitationSent {
  // Nur ein ausdrückliches false heisst „Mail nicht raus".
  return { ...mapInvitation(raw), mailSent: raw?.mailSent !== false }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMyInvitation(raw: any): MyBrandInvitation {
  return {
    id: str(raw?.id),
    companyName: str(raw?.companyName),
    invitedByName: str(raw?.invitedByName),
    expiresAt: str(raw?.expiresAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAcceptedInvitation(data: any): AcceptedInvitation {
  return {
    brandId: idOf(data?.brandId),
    companyName: str(data?.companyName),
    role: data?.role === 'owner' ? 'owner' : 'member',
  }
}

/** Die Angebotsfrist ist verstrichen (das System storniert in Kürze). */
export function isOfferExpired(order: Pick<BrandOrder, 'offerExpiresAt'>, now: Date = new Date()): boolean {
  if (!order.offerExpiresAt) return false
  const expires = new Date(order.offerExpiresAt)
  return !isNaN(expires.getTime()) && expires.getTime() < now.getTime()
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

  /**
   * Lädt das Eventbild zum Entwurf hoch (Feldname 'image', höchstens
   * EVENT_IMAGE_MAX_BYTES). Ein zweiter Upload ersetzt das erste Bild. Nur im
   * Status 'draft'; sonst 409. Ein unlesbares Bild kommt als 400 zurück.
   */
  async uploadOrderImage(id: string, file: File): Promise<BrandOrder> {
    const form = new FormData()
    form.append('image', file)
    const response = await apiClient.post(`/brand-orders/${id}/event-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapBrandOrder(unwrap(response))
  },

  /** Entfernt das Eventbild vom Entwurf. Nur im Status 'draft'; sonst 409. */
  async removeOrderImage(id: string): Promise<BrandOrder> {
    const response = await apiClient.delete(`/brand-orders/${id}/event-image`)
    return mapBrandOrder(unwrap(response))
  },

  /**
   * Einreichen. Ein unvollständiger Entwurf bekommt 400 mit der Liste der
   * fehlenden Felder in data.missing — siehe readMissingFields().
   */
  async submitOrder(id: string): Promise<BrandOrder> {
    const response = await apiClient.post(`/brand-orders/${id}/submit`)
    return mapBrandOrder(unwrap(response))
  },

  /**
   * Storniert den Auftrag endgültig: Entwurf verwerfen, eingereichten
   * Auftrag zurückziehen, das Angebot ablehnen oder den Checkout abbrechen.
   * Erlaubt bis 'awaiting_payment' (solange kein Geld unterwegs ist); ab
   * 'confirmed' antwortet das Backend mit 409. Ein leerer Grund bleibt weg.
   */
  async cancelOrder(id: string, reason?: string): Promise<BrandOrder> {
    const trimmed = reason?.trim()
    const response = await apiClient.post(`/brand-orders/${id}/cancel`, trimmed ? { reason: trimmed } : {})
    return mapBrandOrder(unwrap(response))
  },

  /**
   * Angebot annehmen und bezahlen: startet den Stripe-Checkout und liefert
   * die Seite, auf die die Brand weitergeleitet wird. Der Auftrag steht
   * danach auf 'awaiting_payment'; bestätigt wird er mit dem Zahlungseingang.
   * `returnPath` ist der (sprachabhängige) Pfad dieses Auftrags, auf den
   * Stripe zurückleitet. Nur aus 'offer_sent'/'awaiting_payment'; sonst 409.
   */
  async startCheckout(id: string, returnPath: string, locale: 'de' | 'en'): Promise<CheckoutStart> {
    // Die eigene Origin mitschicken (Vercel-Preview beim Testen); das Backend
    // übernimmt sie nur, wenn sie auf seiner Allowlist steht. Nur HTTPS: Eine
    // http://localhost-Origin wiese das Backend ohnehin ab, und Stripe leitet
    // nicht auf unverschlüsselte Seiten zurück.
    const returnOrigin =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? window.location.origin : undefined
    const response = await apiClient.post(`/brand-orders/${id}/checkout`, { returnPath, locale, returnOrigin })
    const data = unwrap(response) ?? {}
    return { url: str(data.url), sessionId: str(data.sessionId), expiresAt: str(data.expiresAt) }
  },

  /**
   * Zieht den Zahlungsstand bei Stripe nach — nach der Rückkehr aus dem
   * Checkout, weil der Webhook ein paar Sekunden später kommen kann.
   */
  async syncCheckout(id: string): Promise<BrandOrder> {
    const response = await apiClient.post(`/brand-orders/${id}/checkout/sync`)
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

  // ── Team ───────────────────────────────────────────────────────────

  /** Mitglieder und offene Einladungen der eigenen Brand. */
  async getTeam(): Promise<BrandTeam> {
    const response = await apiClient.get('/brands/me/team')
    const data = unwrap(response) ?? {}
    return {
      members: Array.isArray(data.members) ? data.members.map(mapTeamMember) : [],
      invitations: Array.isArray(data.invitations) ? data.invitations.map(mapInvitation) : [],
    }
  },

  /** 409 mit Meldung (schon Mitglied, schon eingeladen, …), 429 bei zu vielen Mails. */
  async inviteMember(email: string): Promise<BrandInvitationSent> {
    const response = await apiClient.post('/brands/me/invitations', { email })
    return mapInvitationSent(unwrap(response))
  },

  async revokeInvitation(id: string): Promise<void> {
    await apiClient.delete(`/brands/me/invitations/${encodeURIComponent(id)}`)
  },

  async resendInvitation(id: string): Promise<BrandInvitationSent> {
    const response = await apiClient.post(`/brands/me/invitations/${encodeURIComponent(id)}/resend`)
    return mapInvitationSent(unwrap(response))
  },

  /**
   * Vorschau einer Einladung. Ohne Login erreichbar, deshalb über publicClient:
   * Der Token im Link ist der Nachweis, und ein abgelaufener Login darf hier
   * nicht in die Abmelde-Logik laufen. Antwortet immer mit 200 und einem state.
   */
  async previewInvitation(token: string): Promise<InvitationPreview> {
    const response = await publicClient.get(`/brands/invitations/${encodeURIComponent(token)}`)
    const data = unwrap(response) ?? {}
    return {
      state: INVITATION_STATES.includes(data.state) ? (data.state as InvitationState) : 'unknown',
      companyName: data.companyName ? str(data.companyName) : null,
      maskedEmail: data.maskedEmail ? str(data.maskedEmail) : null,
    }
  },

  /** 403: falsches Konto (Meldung nennt die maskierte Adresse), 404: ungültig, 409: nicht möglich. */
  async acceptInvitation(token: string): Promise<AcceptedInvitation> {
    const response = await apiClient.post(`/brands/invitations/${encodeURIComponent(token)}/accept`)
    return mapAcceptedInvitation(unwrap(response))
  },

  /**
   * Offene Einladungen an die Adresse des Kontos. Leer ohne bestätigte Adresse
   * und für Konten, die schon zu einer Brand gehören.
   */
  async getMyInvitations(): Promise<MyBrandInvitation[]> {
    const response = await apiClient.get('/brands/invitations/mine')
    const data = unwrap(response)
    return Array.isArray(data) ? data.map(mapMyInvitation) : []
  },

  /** 404: nicht mehr gültig, 409: mit diesem Konto nicht möglich, 429: gedrosselt. */
  async acceptMyInvitation(id: string): Promise<AcceptedInvitation> {
    const response = await apiClient.post(`/brands/invitations/${encodeURIComponent(id)}/accept-mine`)
    return mapAcceptedInvitation(unwrap(response))
  },

  async declineMyInvitation(id: string): Promise<void> {
    await apiClient.post(`/brands/invitations/${encodeURIComponent(id)}/decline-mine`)
  },

  async removeMember(userId: string): Promise<void> {
    await apiClient.delete(`/brands/me/members/${encodeURIComponent(userId)}`)
  },

  /** 409, wenn der Inhaber austreten will: Er muss die Brand zuerst übertragen. */
  async leaveBrand(): Promise<void> {
    await apiClient.post('/brands/me/leave')
  },

  /**
   * Inhaberschaft übertragen. Das Passwort bleibt weg, wenn nichts eingegeben
   * ist: Konten aus Google- oder Apple-Login prüft das Backend ohne Passwort.
   */
  async transferOwnership(userId: string, password?: string): Promise<{ ownerUserId: string }> {
    const response = await apiClient.post('/brands/me/transfer-ownership', {
      userId,
      ...(password ? { password } : {}),
    })
    const data = unwrap(response) ?? {}
    return { ownerUserId: idOf(data.ownerUserId) }
  },
}

/** 404 von GET /brands/me: Dieses Konto hat kein Brand-Profil. */
export function isBrandNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

/** 429: Das Backend drosselt — der Rohtext („ThrottlerException") hilft der Brand nicht. */
export function isRateLimited(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429
}

/** Die Fehlermeldung des Backends, sonst der Fallback. */
export function readBrandError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[]; msg?: string } | undefined
    // class-validator liefert die Meldungen als Liste.
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    return message || data?.msg || fallback
  }
  return fallback
}

/**
 * Fehlermeldung der Team-Routen.
 *
 * Es gibt zwei Arten von 429: Die Drossel (code 'RATE_LIMITED', früher der
 * Rohtext „ThrottlerException") bekommt die vorhandene „zu viele Versuche"-
 * Meldung. Die fachlichen Grenzen („gerade erst verschickt", „zu viele
 * Einladungen") haben einen eigenen Text und zeigen den.
 */
export function readBrandTeamError(error: unknown, fallback: string, rateLimited: string): string {
  if (isRateLimited(error) && axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: unknown; message?: unknown } | undefined
    const throttled =
      data?.code === 'RATE_LIMITED' || typeof data?.message !== 'string' || /throttler/i.test(data.message)
    if (throttled) return rateLimited
  }
  return readBrandError(error, fallback)
}

/** HTTP-Status eines Fehlers aus apiClient, sonst undefined. */
export function brandErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

/**
 * Das Backend verlangt beim Anlegen und Einreichen das Auszahlungskonto des
 * INHABERS, auch wenn ein Mitglied den Auftrag anlegt. Die Meldung ist auf den
 * Inhaber zugeschnitten („Verbinde zuerst dein …") und wird am Wort erkannt.
 */
export function isPayoutAccountError(error: unknown): boolean {
  return /auszahlungskonto/i.test(readBrandError(error, ''))
}

/**
 * Die fehlenden Felder aus der 400-Antwort von POST /brand-orders/:id/submit
 * (data.missing: 'goal' | 'budget' | 'eventName' | 'eventDate' |
 * 'eventDateInPast' | 'eventImage' | 'deliverables'). Leer, wenn es keine
 * solche Liste gibt.
 */
export function readMissingFields(error: unknown): string[] {
  if (!axios.isAxiosError(error)) return []
  const data = error.response?.data as { data?: { missing?: unknown } } | undefined
  const missing = data?.data?.missing
  return Array.isArray(missing) ? missing.filter((entry): entry is string => typeof entry === 'string') : []
}
