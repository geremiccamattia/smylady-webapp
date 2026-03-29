import { apiClient } from './api'

export interface Notification {
  _id: string
  id?: string
  title: string
  message: string
  type: string
  eventId?: string
  createdAt: string
  read?: boolean
  isRead?: boolean
  ticketId?: string
  roomId?: string
  postId?: string
  memoryId?: string
  memoryIndex?: number
  commentId?: string
  commentIndex?: number
  image?: string
  sender?: {
    id?: string
    name?: string
    profileImage?: string | null
  }
}

export const notificationsService = {
  // Get all notifications - with error handling like mobile
  getAll: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/notifications/get-all-notifications')
      return response.data.data || []
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  },

  // Mark single notification as read - with error handling
  markAsRead: async (notificationId: string): Promise<Notification | null> => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}`)
      return response.data.data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return null
    }
  },

  // Mark all notifications as read - with error handling
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.patch('/notifications/mark-all-as-read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  // Delete a notification - with error handling
  delete: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },

  // Get unread count (calculated from all notifications, like mobile app)
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get('/notifications/get-all-notifications')
      const notifications = response.data.data || []
      // Count notifications where isRead is false or read is false
      return notifications.filter((n: Notification) => !n.isRead && !n.read).length
    } catch {
      return 0
    }
  },
}
