import { apiClient } from './api'
import { Ticket } from '@/types'

export const ticketsService = {
  // Get my tickets
  async getMyTickets(): Promise<Ticket[]> {
    const response = await apiClient.get('/tickets/my-tickets')
    return response.data.data
  },

  // Alias for getMyTickets - used by memories feature
  async getUserTickets(): Promise<Ticket[]> {
    return this.getMyTickets()
  },

  // Get ticket by ID - matches mobile app endpoint
  async getTicketById(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/ticket/${id}`)
    return response.data.data
  },

  // Purchase ticket (initiate Stripe checkout) - only 1 ticket per event
  async purchaseTicket(eventId: string): Promise<{ sessionId: string; url: string }> {
    const response = await apiClient.post('/tickets/purchase', {
      eventId,
    })
    return response.data.data
  },

  // Get ticket QR code
  async getTicketQRCode(ticketId: string): Promise<{ qrCode: string }> {
    const response = await apiClient.get(`/tickets/${ticketId}/qr`)
    return response.data.data
  },

  // Request ticket cancellation/refund
  async requestRefund(ticketId: string, reason?: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/tickets/${ticketId}/refund`, { reason })
    return response.data
  },

  // Verify QR code - matches mobile app endpoint
  // Backend returns: { ticketId, userName, alreadyScanned, scannedAt? }
  async verifyTicket(ticketId: string, verificationCode: string, eventId: string): Promise<{ ticketId: string; userName: string; alreadyScanned: boolean; scannedAt?: string }> {
    const response = await apiClient.post('/tickets/verify-qr', { ticketId, verificationCode, eventId })
    return response.data.data
  },

  // Get upcoming tickets (filtered client-side like mobile app)
  async getUpcomingTickets(): Promise<Ticket[]> {
    const allTickets = await this.getMyTickets()
    const now = new Date()

    return allTickets
      .filter((ticket: any) => {
        // Get event from ticket - backend populates event/eventId
        const event = ticket.event || ticket.eventId
        if (!event || typeof event === 'string') return false

        const eventTime = event.eventStartTime || event.eventDate
        if (!eventTime) return false

        return new Date(eventTime) >= now
      })
      .sort((a: any, b: any) => {
        const eventA = a.event || a.eventId
        const eventB = b.event || b.eventId
        const timeA = eventA?.eventStartTime || eventA?.eventDate
        const timeB = eventB?.eventStartTime || eventB?.eventDate
        return new Date(timeA).getTime() - new Date(timeB).getTime()
      })
  },

  // Get past tickets (filtered client-side like mobile app)
  async getPastTickets(): Promise<Ticket[]> {
    const allTickets = await this.getMyTickets()
    const now = new Date()

    return allTickets
      .filter((ticket: any) => {
        // Get event from ticket - backend populates event/eventId
        const event = ticket.event || ticket.eventId
        if (!event || typeof event === 'string') return false

        const eventTime = event.eventStartTime || event.eventDate
        if (!eventTime) return false

        return new Date(eventTime) < now
      })
      .sort((a: any, b: any) => {
        const eventA = a.event || a.eventId
        const eventB = b.event || b.eventId
        const timeA = eventA?.eventStartTime || eventA?.eventDate
        const timeB = eventB?.eventStartTime || eventB?.eventDate
        // Sort past by most recent first
        return new Date(timeB).getTime() - new Date(timeA).getTime()
      })
  },

  // Get scan statistics for an event - matches mobile app endpoint
  async getScanStatistics(eventId: string): Promise<{
    totalTickets: number
    scannedTickets: number
    scannedCount?: number
    pendingTickets: number
    pendingCount?: number
    scanPercentage: number
    scannedList: { ticketId: string; userName: string; userEmail?: string; profileImage?: string; scannedAt: string }[]
    pendingList: { ticketId: string; userName: string; userEmail?: string; profileImage?: string }[]
  }> {
    const response = await apiClient.get(`/tickets/scan-statistics/${eventId}`)
    return response.data.data
  },

  // Get or create organizer ticket - matches mobile app endpoint (GET not POST)
  async getOrCreateOrganizerTicket(eventId: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/organizer-ticket/${eventId}`)
    return response.data.data
  },

  // Get event participants - like mobile app
  async getEventParticipants(eventId: string): Promise<Array<{
    _id: string
    name: string
    email?: string
    profileImage?: string
    ticketId: string
    scanned: boolean
    scannedAt?: string
  }>> {
    const response = await apiClient.get(`/tickets/event/${eventId}/participants`)
    return response.data.data || []
  },

  // Get refund preview - like mobile app
  async getRefundPreview(ticketId: string): Promise<{
    refundAmount: number
    originalAmount: number
    fee: number
    currency: string
  }> {
    const response = await apiClient.get(`/tickets/${ticketId}/refund-preview`)
    return response.data.data
  },

  // Cancel ticket - like mobile app
  async cancelTicket(ticketId: string, reason?: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/tickets/${ticketId}/cancel`, { reason })
    return response.data
  },
}
