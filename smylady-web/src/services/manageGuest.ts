import { apiClient } from './api'

export interface GuestListItem {
  _id: string
  ticketId: string
  userId: {
    _id: string
    name: string
    username?: string
    profileImage?: string
  }
  status: 'active' | 'cancelled' | 'used'
  purchasedAt: string
  usedAt?: string
}

export const manageGuestService = {
  /**
   * Get guest list for an event (organizer only)
   */
  async getGuestList(eventId: string): Promise<GuestListItem[]> {
    const response = await apiClient.get(`/events/${eventId}/guest-list`)
    return response.data.data
  },

  /**
   * Export guest list as CSV
   */
  async exportGuestListCSV(eventId: string): Promise<Blob> {
    const response = await apiClient.get(`/events/${eventId}/guest-list/export`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Send notification to all guests
   */
  async notifyAllGuests(eventId: string, message: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/notify-guests`, { message })
  },
}
