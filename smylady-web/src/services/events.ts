'use client'

import axios from 'axios'
import { apiClient } from './api'
import { CONFIG } from '@/lib/constants'
import { Event, EventFilters } from '@/types'

// Separate axios instance for public endpoints (no auth interceptor / no 401 redirect)
const publicClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

/** Ein Zugangslink, wie ihn GET /events/:id/scan-tokens zurückgibt. */
export interface ScanTokenSummary {
  id: string
  label: string
  createdAt: string
  expiresAt: string
  revokedAt?: string | null
  status: 'active' | 'expired' | 'revoked'
  scannedTickets: number
}

/** Eine Person mit Scan-Recht, wie sie GET /events/:id/scanners zurückgibt. */
export interface EventScanner {
  id: string
  name: string
  username: string
  profileImage: string
  profileImageThumbnailUrl?: string
}

export const eventsService = {
  // Get all events with filters - with error handling
  async getEvents(filters: EventFilters = {}, upcoming: boolean = false): Promise<Event[]> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      params.append('upcoming', String(upcoming))

      const response = await apiClient.get(`/events?${params.toString()}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting events:', error)
      return []
    }
  },

  // Get event by ID - with error handling
  // Throws on 403 (visibility restricted) and 401 (expired token, caller can fall back to the public endpoint)
  async getEventById(id: string, populateCreator: boolean = true): Promise<Event | null> {
    try {
      const response = await apiClient.get(`/events/${id}?populateCreator=${populateCreator}`)
      return response.data.data || null
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        throw error
      }
      console.error('Error getting event by ID:', error)
      return null
    }
  },

  // Get my events (as organizer) - with error handling
  async getMyEvents(): Promise<Event[]> {
    try {
      const response = await apiClient.get('/events/my-events')
      return response.data.data || []
    } catch (error) {
      console.error('Error getting my events:', error)
      return []
    }
  },

  // Create event
  async createEvent(eventData: FormData): Promise<Event> {
    const response = await apiClient.post('/events', eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  // Update event - WICHTIG: Backend verwendet PATCH, nicht PUT!
  async updateEvent(id: string, eventData: FormData): Promise<Event> {
    const response = await apiClient.patch(`/events/${id}`, eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`)
  },

  // Delete event series
  async deleteEventSeries(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}/series`)
  },

  // ──────────────────────────────────────────────────
  // SCAN-ZUGÄNGE (Links für Personal ohne Konto)
  // ──────────────────────────────────────────────────

  /**
   * Legt einen Zugangslink an. Der Klartext-Token steht NUR in dieser Antwort —
   * gespeichert wird er gehasht, ein verlorener Link muss widerrufen und neu
   * erzeugt werden. Die aufrufende Seite muss ihn deshalb sofort anzeigen.
   */
  async createScanToken(
    eventId: string,
    data: { label: string; expiresAt?: string },
  ): Promise<{ id: string; label: string; expiresAt: string; token: string }> {
    const response = await apiClient.post(`/events/${eventId}/scan-tokens`, data)
    return response.data.data
  },

  async listScanTokens(eventId: string): Promise<ScanTokenSummary[]> {
    const response = await apiClient.get(`/events/${eventId}/scan-tokens`)
    return response.data.data || []
  },

  async revokeScanToken(eventId: string, tokenId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/scan-tokens/${tokenId}`)
  },

  // ──────────────────────────────────────────────────
  // SCANNER-PERSONEN (scannen über ihr eigenes Konto)
  // ──────────────────────────────────────────────────

  async listScanners(eventId: string): Promise<EventScanner[]> {
    const response = await apiClient.get(`/events/${eventId}/scanners`)
    return response.data.data || []
  },

  async addScanner(eventId: string, userId: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/scanners`, { userId })
  },

  async removeScanner(eventId: string, userId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/scanners/${userId}`)
  },

  // Cancel event
  async cancelEvent(id: string, reason?: string): Promise<Event> {
    const response = await apiClient.patch(`/events/${id}/cancel`, { reason })
    return response.data.data
  },

  // Get featured events - with error handling
  async getFeaturedEvents(): Promise<Event[]> {
    try {
      const response = await apiClient.get('/events/featured')
      return response.data.data || []
    } catch (error) {
      console.error('Error getting featured events:', error)
      return []
    }
  },

  // Get nearby events - with error handling
  async getNearbyEvents(lat: number, lng: number, radius: number = 50): Promise<Event[]> {
    try {
      const response = await apiClient.get('/events/nearby', {
        params: { lat, lng, radius },
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error getting nearby events:', error)
      return []
    }
  },

  // Search events - with error handling
  async searchEvents(query: string): Promise<Event[]> {
    try {
      const response = await apiClient.get('/events/search', {
        params: { q: query },
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error searching events:', error)
      return []
    }
  },

  // Get event attendees - with error handling
  async getEventAttendees(eventId: string): Promise<{ user: { id: string; name: string; profileImage?: string } }[]> {
    try {
      const response = await apiClient.get(`/events/${eventId}/attendees`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting event attendees:', error)
      return []
    }
  },

  // Toggle favorite - with error handling
  async toggleFavorite(eventId: string): Promise<{ isFavorite: boolean } | null> {
    try {
      const response = await apiClient.post(`/events/${eventId}/favorite`)
      return response.data.data
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return null
    }
  },

  // ──────────────────────────────────────────────────
  // PUBLIC ENDPOINTS (no auth required)
  // ──────────────────────────────────────────────────

  // Create event series
  async createEventSeries(eventData: FormData): Promise<{ seriesId: string; events: Event[] }> {
    const response = await apiClient.post('/events/series', eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data.data
  },

  // Update event series
  async updateEventSeries(id: string, eventData: FormData): Promise<void> {
    await apiClient.patch(`/events/${id}/series`, eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Add additional dates to an existing event series
  async addSeriesDates(eventId: string, dates: string[]): Promise<any> {
    const response = await apiClient.post(`/events/${eventId}/series/add-dates`, { dates })
    return response.data
  },

  // Convert an existing single event into a series server-side (no re-upload needed)
  async convertToSeries(eventId: string, seriesConfig: { recurrence: string; occurrences?: number; customDates?: string[] }): Promise<any> {
    const response = await apiClient.post(`/events/${eventId}/series/convert`, seriesConfig)
    return response.data
  },

  // Get public events without authentication
  async getPublicEvents(filters: EventFilters = {}, upcoming: boolean = false): Promise<Event[]> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      params.append('upcoming', String(upcoming))

      const response = await publicClient.get(`/events/public?${params.toString()}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting public events:', error)
      return []
    }
  },

  async getTopPicks(lat: number, lng: number): Promise<Event[]> {
    try {
      const response = await apiClient.get('/events/top-picks', {
        params: { lat, lng },
      })
      return response.data.data || []
    } catch {
      return []
    }
  },

  async translateText(
    data: { name: string; description: string; restrictions: string },
    targetLang: 'DE' | 'EN',
  ): Promise<{
    translated: { name: string; description: string; restrictions: string; detectedSourceLang: string };
  }> {
    const response = await apiClient.post('/events/translate-text', { ...data, targetLang })
    return response.data.data
  },

  async saveEventTranslation(
    eventId: string,
    lang: string,
    data: { name: string; description: string; restrictions: string },
  ): Promise<void> {
    await apiClient.patch(`/events/${eventId}/translation`, { lang, ...data })
  },

  async translateEvent(eventId: string, targetLang: 'DE' | 'EN'): Promise<{
    translations: Record<string, { name: string; description: string; restrictions: string }>;
    detectedSourceLang: string;
  }> {
    const response = await apiClient.post(`/events/${eventId}/translate?targetLang=${targetLang}`)
    return response.data.data
  },

  // Get a single public event by ID without authentication
  async getPublicEventById(id: string, populateCreator: boolean = true): Promise<Event | null> {
    try {
      const response = await publicClient.get(`/events/public/${id}?populateCreator=${populateCreator}`)
      return response.data.data || null
    } catch (error: any) {
      if (error?.response?.status === 403) {
        throw error
      }
      console.error('Error getting public event by ID:', error)
      return null
    }
  },

  async getAttendeePreviews(eventIds: string[]): Promise<
    Record<string, Array<{ _id: string; name: string; profileImage?: string }>>
  > {
    try {
      const response = await apiClient.post('/events/attendee-previews', { eventIds })
      return response.data.data || {}
    } catch {
      return {}
    }
  },

  async getEventMemories(eventId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/events/${eventId}/memories`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  async getRecentMemories(): Promise<any[]> {
    try {
      const response = await apiClient.get('/events/recent-memories')
      return response.data.data || []
    } catch {
      return []
    }
  },
}
