'use client'

import axios from 'axios'
import { apiClient } from './api'

/**
 * Stand der eigenen Creator-Bewerbung, aus `GET /influencer/my-application`.
 *
 * `application` ist null, wenn für dieses Konto keine Bewerbung vorliegt.
 * `hasCreatorProfile` schlägt alles: Wer schon ein Creator-Profil hat, ist
 * Mitglied — auch wenn daneben noch ein alter Antrag im Status 'approved' liegt.
 */

export type CreatorApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface MyCreatorApplication {
  application: { status: CreatorApplicationStatus; createdAt: string } | null
  hasCreatorProfile: boolean
}

/** Die Sicht, die sich aus der Serverantwort ergibt. */
export type CreatorStanding = 'none' | 'pending' | 'approved' | 'rejected' | 'member'

export const creatorService = {
  async getMyApplication(): Promise<MyCreatorApplication | undefined> {
    const response = await apiClient.get<
      { data?: MyCreatorApplication } & MyCreatorApplication
    >('/influencer/my-application')
    // Das Backend antwortet je nach Endpunkt mit oder ohne data-Hülle.
    return response.data?.data ?? response.data
  },
}

/**
 * Reihenfolge der Fälle ist bedeutsam, siehe oben: Profil vor Bewerbung.
 * Ein unbekannter Status gilt als 'pending' — lieber den Stand offenlassen
 * als ein zweites Bewerbungsformular anbieten.
 */
export function resolveCreatorStanding(payload: MyCreatorApplication): CreatorStanding {
  if (payload.hasCreatorProfile) return 'member'
  if (!payload.application) return 'none'

  switch (payload.application.status) {
    case 'rejected':
      return 'rejected'
    case 'approved':
      return 'approved'
    case 'pending':
    default:
      return 'pending'
  }
}

// ───────────────────────────────────────────────────────────────
// Creator-Bereich: eigenes Profil und Auftragsanfragen
// ───────────────────────────────────────────────────────────────

/*
 * GET/PATCH /creators/me funktionieren in jedem Profilstatus. Die Anfragen
 * unter /creators/me/assignments hängen am CreatorGuard und verlangen ein
 * AKTIVES Profil — sonst 403 (siehe isCreatorForbidden).
 */

export type CreatorProfileStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'suspended'

export const CREATOR_PLATFORMS = ['Instagram', 'TikTok', 'Snapchat', 'YouTube', 'Sonstige'] as const
export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number]

export const CREATOR_FOLLOWER_RANGES = [
  'Unter 1.500',
  '1.500–5.000',
  '5.001–10.000',
  '10.001–25.000',
  '25.001–50.000',
  '50.001–100.000',
  'Über 100.000',
] as const

export const CREATOR_CATEGORIES = [
  'Nightlife',
  'Lifestyle',
  'Fashion',
  'Food & Drinks',
  'Travel',
  'Business',
  'Musik',
  'Fitness',
  'Kunst & Kultur',
  'Student Life',
] as const

export interface CreatorChannel {
  platform: CreatorPlatform
  username: string
  url?: string
  followerRange?: string
  isPrimary?: boolean
}

export interface CreatorProfile {
  id: string
  status: CreatorProfileStatus
  channels: CreatorChannel[]
  categories: string[]
  city: string
  portfolioLinks: string[]
  bio: string
  brandVisibilityConsent: boolean
  createdAt: string
}

export interface UpdateCreatorProfilePayload {
  channels?: CreatorChannel[]
  categories?: string[]
  city?: string
  portfolioLinks?: string[]
  bio?: string
  brandVisibilityConsent?: boolean
}

export type AssignmentResponse = 'pending' | 'accepted' | 'declined'

export interface CreatorAssignment {
  id: string
  /** 'draft' heisst: Briefing-Unterlagen folgen noch; 'sent' ist komplett. */
  status: 'draft' | 'sent' | string
  eventId: string
  eventName: string
  eventDate: string
  eventLocation: string
  briefingText: string
  deliverables: { type: string; quantity: number; platform?: string; notes?: string }[]
  compensation: number | null
  response: AssignmentResponse
  sentAt: string
  respondedAt: string
}

const text = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value)
const idOf = (value: unknown): string =>
  value && typeof value === 'object' ? text((value as { _id?: unknown })._id) : text(value)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreatorProfile(raw: any): CreatorProfile {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channels: any[] = Array.isArray(raw?.channels) ? raw.channels : []
  return {
    id: text(raw?._id || raw?.id),
    status: (raw?.status || 'pending') as CreatorProfileStatus,
    channels: channels.map((channel) => ({
      platform: (text(channel?.platform) || 'Sonstige') as CreatorPlatform,
      username: text(channel?.username),
      url: text(channel?.url) || undefined,
      followerRange: text(channel?.followerRange) || undefined,
      isPrimary: Boolean(channel?.isPrimary),
    })),
    categories: Array.isArray(raw?.categories) ? raw.categories.map(text) : [],
    city: text(raw?.city),
    portfolioLinks: Array.isArray(raw?.portfolioLinks) ? raw.portfolioLinks.map(text) : [],
    bio: text(raw?.bio),
    brandVisibilityConsent: Boolean(raw?.brandVisibilityConsent),
    createdAt: text(raw?.createdAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCreatorAssignment(raw: any): CreatorAssignment {
  const event = raw?.eventId && typeof raw.eventId === 'object' ? raw.eventId : {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deliverables: any[] = Array.isArray(raw?.deliverables) ? raw.deliverables : []
  const own = raw?.own ?? {}
  const compensation = Number(own.compensation)
  return {
    id: text(raw?._id || raw?.id),
    status: text(raw?.status) || 'draft',
    eventId: idOf(raw?.eventId),
    eventName: text(event.name),
    eventDate: text(event.eventDate),
    eventLocation: text(event.locationName),
    briefingText: text(raw?.briefingText),
    deliverables: deliverables.map((entry) => ({
      type: text(entry?.type) || 'other',
      quantity: Number(entry?.quantity) || 1,
      platform: text(entry?.platform) || undefined,
      notes: text(entry?.notes) || undefined,
    })),
    compensation: Number.isFinite(compensation) ? compensation : null,
    response: (own.status || 'pending') as AssignmentResponse,
    sentAt: text(own.sentAt),
    respondedAt: text(own.respondedAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrapData = (response: { data?: any }): any => response.data?.data ?? response.data

export const creatorAreaService = {
  /** Eigenes Profil, in jedem Status. 404, wenn keins existiert. */
  async getMyProfile(): Promise<CreatorProfile> {
    const response = await apiClient.get('/creators/me')
    return mapCreatorProfile(unwrapData(response))
  },

  async updateMyProfile(payload: UpdateCreatorProfilePayload): Promise<CreatorProfile> {
    const response = await apiClient.patch('/creators/me', payload)
    return mapCreatorProfile(unwrapData(response))
  },

  async getMyAssignments(): Promise<CreatorAssignment[]> {
    const response = await apiClient.get('/creators/me/assignments')
    const data = unwrapData(response)
    return Array.isArray(data) ? data.map(mapCreatorAssignment) : []
  },

  async getMyAssignment(id: string): Promise<CreatorAssignment> {
    const response = await apiClient.get(`/creators/me/assignments/${id}`)
    return mapCreatorAssignment(unwrapData(response))
  },

  /** Nur solange die eigene Antwort 'pending' ist; sonst 409. */
  async respond(id: string, answer: 'accept' | 'decline'): Promise<CreatorAssignment> {
    const response = await apiClient.post(`/creators/me/assignments/${id}/${answer}`)
    return mapCreatorAssignment(unwrapData(response))
  },
}

/** 403 vom CreatorGuard: Es gibt ein Profil, aber es ist nicht aktiv. */
export function isCreatorForbidden(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}

/** 404 von GET /creators/me: Dieses Konto hat kein Creator-Profil. */
export function isCreatorNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function readCreatorError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; msg?: string } | undefined
    return data?.message || data?.msg || fallback
  }
  return fallback
}
