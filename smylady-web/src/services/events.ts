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
  // Throws on 403 (visibility restricted) so the UI can show a proper message
  async getEventById(id: string, populateCreator: boolean = true): Promise<Event | null> {
    try {
      const response = await apiClient.get(`/events/${id}?populateCreator=${populateCreator}`)
      return response.data.data || null
    } catch (error: any) {
      // Re-throw 403 errors so the UI can handle visibility restrictions
      if (error?.response?.status === 403) {
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
}
