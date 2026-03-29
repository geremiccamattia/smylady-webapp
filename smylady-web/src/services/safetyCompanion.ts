import { apiClient } from './api'

export interface SafetyCompanion {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  companionId: {
    _id: string
    name: string
    email: string
    profileImage?: string
  }
  eventId: {
    _id: string
    name: string
    eventDate: string
    location: {
      type: string
      coordinates: number[]
    }
  }
  status: 'pending' | 'accepted' | 'rejected'
  acceptedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MyCompanion extends SafetyCompanion {
  companionHasTicket: boolean
  isValid: boolean
}

export interface EventWithCompanions {
  event: {
    _id: string
    name: string
    eventDate: string
    location: {
      type: string
      coordinates: number[]
    }
  }
  companionCount: number
}

export interface AddCompanionRequest {
  companionId: string
  eventId: string
}

export interface UpdateCompanionStatusRequest {
  status: 'accepted' | 'rejected'
}

export const safetyCompanionService = {
  // Add a safety companion for an event
  add: async (data: AddCompanionRequest): Promise<SafetyCompanion> => {
    const response = await apiClient.post('/safety-companions', data)
    return response.data.data
  },

  // Update companion request status (accept/reject)
  updateStatus: async (requestId: string, data: UpdateCompanionStatusRequest): Promise<SafetyCompanion> => {
    const response = await apiClient.patch(`/safety-companions/${requestId}/status`, data)
    return response.data.data
  },

  // Get all companion requests for me (pending requests I need to respond to)
  getMyRequests: async (): Promise<SafetyCompanion[]> => {
    const response = await apiClient.get('/safety-companions/requests')
    return response.data.data || []
  },

  // Get all my safety companions (people I added)
  getMyCompanions: async (eventId?: string): Promise<MyCompanion[]> => {
    const response = await apiClient.get('/safety-companions/my-companions', {
      params: eventId ? { eventId } : {},
    })
    return response.data.data || []
  },

  // Remove a safety companion
  remove: async (requestId: string): Promise<void> => {
    await apiClient.delete(`/safety-companions/${requestId}`)
  },

  // Get companions for an event (Admin/Organizer only)
  getByEvent: async (eventId: string): Promise<SafetyCompanion[]> => {
    const response = await apiClient.get(`/safety-companions/event/${eventId}`)
    return response.data.data || []
  },

  // Get all events with companions (Admin only) - matches mobile endpoint
  getEventsWithCompanions: async (): Promise<EventWithCompanions[]> => {
    const response = await apiClient.get('/safety-companions/admin/events-overview')
    return response.data.data || []
  },
}
