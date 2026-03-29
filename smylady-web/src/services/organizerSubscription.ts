import { apiClient } from './api'

export interface OrganizerSubscription {
  _id: string
  subscriberId: string
  organizerId: string
  createdAt: string
}

export interface Organizer {
  _id: string
  name: string
  username: string
  profileImage?: string
  bio?: string
  subscriberCount: number
  eventCount: number
  isSubscribed: boolean
}

export interface OrganizerStats {
  totalSubscribers: number
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
}

export interface OrganizerSubscriber {
  id: string
  _id?: string
  name: string
  username?: string
  profileImage?: string
  subscribedAt: string
}

export const organizerSubscriptionService = {
  // Toggle subscription (returns new state) - matches mobile app endpoint
  toggleSubscription: async (organizerId: string): Promise<boolean> => {
    const response = await apiClient.post(`/organizer-subscriptions/${organizerId}/toggle`)
    return response.data.data?.isSubscribed ?? true
  },

  // Get subscription status - matches mobile app endpoint
  getSubscriptionStatus: async (organizerId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/organizer-subscriptions/${organizerId}`)
      return response.data.data?.isSubscribed || false
    } catch {
      return false
    }
  },

  // Check if subscribed to an organizer - matches mobile app endpoint
  isSubscribed: async (organizerId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/organizer-subscriptions/${organizerId}`)
      return response.data.data?.isSubscribed || false
    } catch {
      return false
    }
  },

  // Get subscriber summary - matches mobile app endpoint
  getSubscriberSummary: async (): Promise<{ totalSubscribers: number }> => {
    const response = await apiClient.get('/organizer-subscriptions/me/summary')
    return response.data.data || { totalSubscribers: 0 }
  },

  // Get subscribers (with search) - matches mobile app endpoint
  getSubscribers: async (search?: string): Promise<{ subscribers: OrganizerSubscriber[]; total: number }> => {
    const params = search ? { search } : {}
    const response = await apiClient.get('/organizer-subscriptions/me/subscribers', { params })
    const data = response.data.data || { total: 0, subscribers: [] }
    return {
      subscribers: data.subscribers?.map((s: OrganizerSubscriber & { _id?: string }) => ({
        ...s,
        id: s.id || s._id,
      })) || [],
      total: data.total || 0,
    }
  },

  // Alias for getSubscribers - for backward compatibility
  getMySubscribers: async (search?: string): Promise<{ subscribers: OrganizerSubscriber[]; total: number }> => {
    return organizerSubscriptionService.getSubscribers(search)
  },

  // Subscribe to user via users endpoint (for follow functionality)
  subscribeToUser: async (userId: string): Promise<boolean> => {
    const response = await apiClient.post(`/users/${userId}/subscribe`)
    return response.data.data?.isSubscribed ?? true
  },

  // Unsubscribe from user via users endpoint (for unfollow functionality)
  unsubscribeFromUser: async (userId: string): Promise<boolean> => {
    const response = await apiClient.delete(`/users/${userId}/subscribe`)
    return !response.data.data?.isSubscribed
  },
}
