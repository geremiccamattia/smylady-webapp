import axios from 'axios'
import { apiClient } from './api'
import { User } from '@/types'
import { CONFIG } from '@/lib/constants'

const publicClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Extended User Profile type with additional fields from mobile app
export interface UserProfile extends User {
  subscriberCount?: number
  subscribedCount?: number
  isSubscribed?: boolean
  isMuted?: boolean
  upcomingEvents?: any[]
  pastEvents?: any[]
  memories?: Array<{
    url: string
    type?: 'image' | 'video'
    ticketId?: string
    memoryId?: string
    eventId?: string
    caption?: string
    likes?: string[]
    likeCount?: number
    comments?: any[]
    photoTags?: any[]
    uploadedBy?: any
    eventTitle?: string
    eventDate?: string
    uploadedAt?: string
    isHighlighted?: boolean
    reactions?: Array<{ emoji: string; userId: string; createdAt?: string }>
  }>
}

export interface SearchedUser {
  _id: string
  id?: string
  name: string
  email?: string
  username?: string
  profileImage?: string
  role?: 'user' | 'organizer' | 'admin'
  subscriberCount?: number
}

export interface BlockStatus {
  isBlocked: boolean
  isBlockedBy: boolean
}

export const userService = {
  // Get user by ID (public profile) - uses /users/:id/profile endpoint (same as mobile app)
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const response = await publicClient.get(`/users/${id}/profile`)
      return response.data.data || null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const response = await apiClient.get(`/users/search`, {
        params: { q: username },
      })
      // Search returns array, find exact match
      const users = response.data.data || []
      const user = users.find((u: User) => u.username === username)
      return user || null
    } catch (error) {
      console.error('Error getting user by username:', error)
      return null
    }
  },

  // Search users - with error handling like mobile
  async searchUsers(query: string): Promise<SearchedUser[]> {
    try {
      const response = await apiClient.get('/users/search', {
        params: { q: query },
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  },

  // Follow user (subscribe) - returns isSubscribed status like mobile
  async followUser(userId: string): Promise<{ isSubscribed: boolean }> {
    try {
      const response = await apiClient.post(`/users/${userId}/subscribe`)
      return response.data.data || { isSubscribed: true }
    } catch (error) {
      console.error('Error subscribing to user:', error)
      throw error
    }
  },

  // Unfollow user (unsubscribe) - returns isSubscribed status like mobile
  async unfollowUser(userId: string): Promise<{ isSubscribed: boolean }> {
    try {
      const response = await apiClient.delete(`/users/${userId}/subscribe`)
      return response.data.data || { isSubscribed: false }
    } catch (error) {
      console.error('Error unsubscribing from user:', error)
      throw error
    }
  },

  // Get followers (subscribers) - with search support like mobile
  async getFollowers(userId: string, search?: string): Promise<User[]> {
    try {
      const response = await apiClient.get(`/users/${userId}/subscribers`, {
        params: search ? { search } : undefined,
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error getting followers:', error)
      return []
    }
  },

  // Get following - with search support like mobile
  async getFollowing(userId: string, search?: string): Promise<User[]> {
    try {
      const response = await apiClient.get(`/users/${userId}/following`, {
        params: search ? { search } : undefined,
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error getting following:', error)
      return []
    }
  },

  // Block user - returns isBlocked status like mobile
  async blockUser(userId: string): Promise<{ isBlocked: boolean }> {
    try {
      const response = await apiClient.post(`/users/block/${userId}`)
      return response.data.data || { isBlocked: true }
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  },

  // Unblock user - returns isBlocked status like mobile
  async unblockUser(userId: string): Promise<{ isBlocked: boolean }> {
    try {
      const response = await apiClient.delete(`/users/block/${userId}`)
      return response.data.data || { isBlocked: false }
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  },

  // Get blocked users - with error handling
  async getBlockedUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get('/users/blocked')
      return response.data.data || []
    } catch (error) {
      console.error('Error getting blocked users:', error)
      return []
    }
  },

  // Get block status for a user
  async getBlockStatus(targetUserId: string): Promise<BlockStatus> {
    try {
      const response = await apiClient.get(`/users/block/${targetUserId}/status`)
      return response.data.data || { isBlocked: false, isBlockedBy: false }
    } catch (error) {
      console.error('Error getting block status:', error)
      return { isBlocked: false, isBlockedBy: false }
    }
  },

  // Mute user
  async muteUser(userId: string): Promise<{ isMuted: boolean }> {
    try {
      const response = await apiClient.post(`/users/${userId}/mute`)
      return response.data.data || { isMuted: true }
    } catch (error) {
      console.error('Error muting user:', error)
      throw error
    }
  },

  // Unmute user
  async unmuteUser(userId: string): Promise<{ isMuted: boolean }> {
    try {
      const response = await apiClient.delete(`/users/${userId}/mute`)
      return response.data.data || { isMuted: false }
    } catch (error) {
      console.error('Error unmuting user:', error)
      throw error
    }
  },

  // Update location
  async updateLocation(locationName: string, coordinates: [number, number]): Promise<User | null> {
    try {
      const response = await apiClient.patch('/users/profile', {
        locationName,
        location: {
          type: 'Point',
          coordinates,
        },
      })
      return response.data.data || null
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  },

  // Delete account
  async deleteAccount(): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete('/users')
      return response.data
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  },

  // Get current user profile (own profile)
  async getCurrentUserProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get('/users/profile')
      return response.data.data || null
    } catch (error) {
      console.error('Error getting current user profile:', error)
      return null
    }
  },

  // Update user profile
  async updateProfile(profileData: Partial<User>): Promise<User | null> {
    try {
      const response = await apiClient.patch('/users/profile', profileData)
      return response.data.data || null
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  // Upload profile image
  async uploadProfileImage(file: File): Promise<{ profileImage: string } | null> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiClient.patch('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      return response.data.data || null
    } catch (error) {
      console.error('Error uploading profile image:', error)
      throw error
    }
  },

  // Delete profile image
  async deleteProfileImage(): Promise<void> {
    try {
      await apiClient.delete('/users/profile-image')
    } catch (error) {
      console.error('Error deleting profile image:', error)
      throw error
    }
  },

  // Get user profile (alias for getUserById)
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.getUserById(userId)
  },

  // Get subscribers (followers)
  async getSubscribers(userId: string, search?: string): Promise<User[]> {
    return this.getFollowers(userId, search)
  },

  // Update user language
  async updateLanguage(language: 'en' | 'de'): Promise<User | null> {
    try {
      const response = await apiClient.patch('/users/profile', { language })
      return response.data.data || null
    } catch (error) {
      console.error('Error updating language:', error)
      throw error
    }
  },

  // Update user role
  async updateRole(role: 'user' | 'organizer'): Promise<User | null> {
    try {
      const response = await apiClient.patch('/users/role', { role })
      return response.data.data || null
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  // Get friends events (events that friends are attending) - like mobile app
  async getFriendsEvents(page = 1, limit = 20): Promise<{
    events: Array<{
      event: {
        _id: string
        name: string
        locationName: string
        locationImages?: Array<{ url: string }>
        eventStartTime: string
        organizer?: { name: string }
      }
      attendees: Array<{
        _id: string
        name: string
        profileImage?: string
      }>
    }>
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    try {
      const response = await apiClient.get('/users/friends/events', {
        params: { page, limit },
      })
      return response.data.data || { events: [], pagination: { page, limit, total: 0, totalPages: 0 } }
    } catch (error) {
      console.error('Error getting friends events:', error)
      return { events: [], pagination: { page, limit, total: 0, totalPages: 0 } }
    }
  },

  // Get friends memories - like mobile app
  async getFriendsMemories(page = 1, limit = 20): Promise<{
    memories: Array<{
      url: string
      type: 'image' | 'video'
      uploader: {
        _id: string
        name: string
        profileImage?: string
      }
      event?: {
        _id: string
        name: string
      }
    }>
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }> {
    try {
      const response = await apiClient.get('/users/friends/memories', {
        params: { page, limit },
      })
      return response.data.data || { memories: [], pagination: { page, limit, total: 0, totalPages: 0 } }
    } catch (error) {
      console.error('Error getting friends memories:', error)
      return { memories: [], pagination: { page, limit, total: 0, totalPages: 0 } }
    }
  },

  // Update terms and conditions acceptance - like mobile app
  async updateTermsAndCondition(): Promise<{ message: string }> {
    try {
      const response = await apiClient.patch('/users/terms-and-conditions')
      return response.data
    } catch (error) {
      console.error('Error updating terms and conditions:', error)
      throw error
    }
  },
}
