import { apiClient } from './api'

export interface Review {
  _id: string
  eventId: string
  userId: {
    _id: string
    name: string
    username: string
    profileImage?: string
  }
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface CreateReviewPayload {
  eventId: string
  rating: number
  comment?: string
}

export interface UpdateReviewPayload {
  rating?: number
  comment?: string
}

export interface ReviewsResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    averageRating: number
    totalReviews: number
  }
}

export const reviewsService = {
  // Create a review for an event
  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const response = await apiClient.post('/reviews', payload)
    return response.data.data
  },

  // Get all reviews for an event
  getEventReviews: async (eventId: string, page = 1, limit = 20): Promise<ReviewsResponse> => {
    const response = await apiClient.get(`/reviews/event/${eventId}`, {
      params: { page, limit },
    })
    return response.data.data
  },

  // Get rating summary for an event
  getEventSummary: async (eventId: string): Promise<ReviewSummary> => {
    const response = await apiClient.get(`/reviews/event/${eventId}/summary`)
    return response.data.data
  },

  // Alias for getEventSummary (mobile app compatibility)
  getEventRatingSummary: async (eventId: string): Promise<ReviewSummary> => {
    const response = await apiClient.get(`/reviews/event/${eventId}/summary`)
    return response.data.data
  },

  // Get current user's review for an event
  getMyReview: async (eventId: string): Promise<Review | null> => {
    try {
      const response = await apiClient.get(`/reviews/event/${eventId}/my-review`)
      return response.data.data
    } catch {
      return null
    }
  },

  // Update a review
  update: async (reviewId: string, payload: UpdateReviewPayload): Promise<Review> => {
    const response = await apiClient.put(`/reviews/${reviewId}`, payload)
    return response.data.data
  },

  // Delete a review
  delete: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`)
  },

  // Get organizer reviews
  getOrganizerReviews: async (organizerId: string, page = 1, limit = 20): Promise<ReviewsResponse> => {
    const response = await apiClient.get(`/reviews/organizer/${organizerId}`, {
      params: { page, limit },
    })
    return response.data.data
  },
}
