import { apiClient } from './api'
import { Event } from '@/types'

interface TicketmasterEventData {
  name: string;
  startDate: string;
  location: string;
  imageUrl: string;
  ticketmasterUrl: string;
}

interface ToggleFavoriteOptions {
  isTicketmaster?: boolean;
  ticketmasterEventData?: TicketmasterEventData;
}

export const favoritesService = {
  // Get my favorites
  async getFavorites(): Promise<Event[]> {
    const response = await apiClient.get('/user-event-favorites')
    return response.data.data
  },

  // Toggle favorite (add or remove)
  async toggleFavorite(
    eventId: string,
    options?: ToggleFavoriteOptions
  ): Promise<{ message: string; isFavorite: boolean; data: { isFavorite: boolean } }> {
    const response = await apiClient.post(`/user-event-favorites/${eventId}/toggle`, options || {})
    return response.data
  },

  // Add to favorites (uses toggle)
  async addFavorite(eventId: string, options?: ToggleFavoriteOptions): Promise<{ message: string }> {
    const response = await apiClient.post(`/user-event-favorites/${eventId}/toggle`, options || {})
    return response.data
  },

  // Remove from favorites (uses toggle)
  async removeFavorite(eventId: string, options?: ToggleFavoriteOptions): Promise<{ message: string }> {
    const response = await apiClient.post(`/user-event-favorites/${eventId}/toggle`, options || {})
    return response.data
  },

  // Check if event is favorited
  async isFavorite(eventId: string): Promise<boolean> {
    const response = await apiClient.get(`/user-event-favorites/${eventId}/status`)
    return response.data.data.isFavorite
  },
}
