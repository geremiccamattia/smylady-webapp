import { apiClient } from './api'

export interface Story {
  _id: string
  userId: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  createdAt: string
  expiresAt: string
  viewCount: number
  likeCount: number
  hasViewed: boolean
  hasLiked: boolean
  isOwnStory: boolean
  views?: string[]
  likes?: string[]
}

export interface UserStories {
  userId: string
  userName: string
  userProfileImage: string | null
  isOwnStory: boolean
  stories: Story[]
  hasUnviewedStories: boolean
}

export interface StoryViewer {
  _id: string
  name: string
  username: string
  profilePicture: string | null
  viewedAt: string
  hasLiked?: boolean
}

export const storiesService = {
  // Get stories feed (from followed users)
  getFeed: async (): Promise<UserStories[]> => {
    try {
      const response = await apiClient.get('/stories/feed')
      console.log('[StoriesService] getFeed raw response:', response.data)
      const data = response.data?.data || response.data || []
      console.log('[StoriesService] getFeed parsed data:', data, 'length:', Array.isArray(data) ? data.length : 'not-array')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[StoriesService] Error fetching feed:', error)
      return []
    }
  },

  // Get own stories
  getMyStories: async (): Promise<Story[]> => {
    try {
      const response = await apiClient.get('/stories/my')
      console.log('[StoriesService] getMyStories raw response:', response.data)
      const data = response.data?.data || response.data || []
      console.log('[StoriesService] getMyStories parsed data:', data, 'length:', Array.isArray(data) ? data.length : 'not-array')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[StoriesService] Error fetching my stories:', error)
      return []
    }
  },

  // Get user's stories
  getUserStories: async (userId: string): Promise<UserStories | null> => {
    const response = await apiClient.get(`/stories/user/${userId}`)
    return response.data.data
  },

  // Get single story
  getStory: async (storyId: string): Promise<Story | null> => {
    const response = await apiClient.get(`/stories/${storyId}`)
    return response.data.data
  },

  // Create story with file upload
  createStory: async (file: File, caption?: string): Promise<Story | null> => {
    const formData = new FormData()
    formData.append('file', file)
    if (caption) {
      formData.append('caption', caption)
    }

    const response = await apiClient.post('/stories/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Delete story
  deleteStory: async (storyId: string): Promise<void> => {
    await apiClient.delete(`/stories/${storyId}`)
  },

  // Mark story as viewed
  viewStory: async (storyId: string): Promise<void> => {
    await apiClient.post(`/stories/${storyId}/view`)
  },

  // Like story
  likeStory: async (storyId: string): Promise<void> => {
    await apiClient.post(`/stories/${storyId}/like`)
  },

  // Unlike story
  unlikeStory: async (storyId: string): Promise<void> => {
    await apiClient.delete(`/stories/${storyId}/like`)
  },

  // Get story viewers
  getViewers: async (storyId: string): Promise<StoryViewer[]> => {
    const response = await apiClient.get(`/stories/${storyId}/viewers`)
    return response.data.data || []
  },

  // Toggle like on story (like mobile app)
  toggleLike: async (storyId: string): Promise<{ liked: boolean }> => {
    const response = await apiClient.post(`/stories/${storyId}/toggle-like`)
    return response.data.data || { liked: false }
  },

  // Get all stories (combined feed) - like mobile app
  getStories: async (): Promise<UserStories[]> => {
    try {
      const response = await apiClient.get('/stories/feed')
      return response.data.data || []
    } catch (error) {
      console.error('Error getting stories:', error)
      return []
    }
  },

  // Get story viewers (alias for getViewers to match mobile API)
  getStoryViewers: async (storyId: string): Promise<StoryViewer[]> => {
    try {
      const response = await apiClient.get(`/stories/${storyId}/viewers`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting story viewers:', error)
      return []
    }
  },
}
