import axios from 'axios'
import { apiClient } from './api'
import { CONFIG } from '@/lib/constants'

const publicClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export interface Post {
  _id: string
  // Backend returns userId as ObjectId string, user info is in "user" field
  userId: string | {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  // Populated user info from backend
  user?: {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  text?: string
  content?: string
  media?: Array<{ url: string; type: 'image' | 'video' }>
  images?: string[]
  eventId?: {
    _id: string
    name: string
    thumbnailUrl?: string
  }
  likeCount: number
  commentCount: number
  hasLiked: boolean
  reactions?: Reaction[]
  comments?: Comment[]
  mentions?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  } | string>
  mentionedUsers?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Reaction {
  userId: string | { _id?: string; id?: string }
  emoji: string
  createdAt: string
}

export interface Reply {
  _id?: string
  // Backend may return userId as string or object
  userId: string | {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  // Populated user info from backend
  user?: {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  text: string
  createdAt: string
  reactions?: Reaction[]
  mentions?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  } | string>
  mentionedUsers?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  }>
}

export interface Comment {
  _id: string
  postId: string
  // Backend may return userId as string or object
  userId: string | {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  // Populated user info from backend
  user?: {
    _id: string
    id?: string
    name: string
    username?: string
    profileImage?: string
  }
  text?: string
  content?: string
  likeCount: number
  hasLiked: boolean
  createdAt: string
  updatedAt: string
  reactions?: Reaction[]
  replies?: Reply[]
  mentions?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  } | string>
  mentionedUsers?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  }>
}

export interface LikedByUser {
  _id: string
  name: string
  username?: string
  profileImage?: string
  emoji?: string
}

export interface CreatePostPayload {
  text: string
  media?: Array<{ url: string; type: 'image' | 'video' }>
  visibility?: 'public' | 'subscribers' | 'private'
  mentions?: string[]
}

export interface UpdatePostPayload {
  text?: string
}

export interface PostsResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const postsService = {
  // Get feed posts - with robust null checks like mobile app
  getFeed: async (page = 1, limit = 20): Promise<PostsResponse> => {
    const emptyResponse: PostsResponse = {
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await apiClient.get('/posts/feed', {
        params: { page, limit },
      })

      if (!response?.data?.data) {
        return emptyResponse
      }

      const { data } = response.data
      const safePosts = Array.isArray(data.posts) ? data.posts : []
      const validPosts = safePosts.filter((p: Post) => p && p._id)

      return {
        posts: validPosts,
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting feed:', error)
      return emptyResponse
    }
  },

  // Get user's posts - with robust null checks like mobile app
  getUserPosts: async (userId: string, page = 1, limit = 20): Promise<PostsResponse> => {
    const emptyResponse: PostsResponse = {
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await apiClient.get(`/posts/user/${userId}`, {
        params: { page, limit },
      })

      if (!response?.data?.data) {
        return emptyResponse
      }

      const { data } = response.data
      const safePosts = Array.isArray(data.posts) ? data.posts : []
      const validPosts = safePosts.filter((p: Post) => p && p._id)

      return {
        posts: validPosts,
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting user posts:', error)
      return emptyResponse
    }
  },

  getPublicUserPosts: async (userId: string, page = 1, limit = 20): Promise<PostsResponse> => {
    const emptyResponse: PostsResponse = {
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await publicClient.get(`/posts/user/${userId}`, {
        params: { page, limit },
      })
      if (!response?.data?.data) return emptyResponse
      const { data } = response.data
      const safePosts = Array.isArray(data.posts) ? data.posts : []
      return {
        posts: safePosts.filter((p: Post) => p && p._id),
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting public user posts:', error)
      return emptyResponse
    }
  },

  // Get single post
  getPost: async (postId: string): Promise<Post | null> => {
    try {
      const response = await apiClient.get(`/posts/${postId}`)
      return response.data.data || null
    } catch (error) {
      console.error('Error getting post:', error)
      return null
    }
  },

  // Upload media for post
  uploadMedia: async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/posts/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for upload
    })
    return response.data.data
  },

  // Create post (with optional media and mentions)
  create: async (payload: { content: string; images?: File[]; mentions?: string[] }): Promise<Post> => {
    // Upload images first if any
    const media: Array<{ url: string; type: 'image' | 'video' }> = []
    if (payload.images && payload.images.length > 0) {
      for (const image of payload.images) {
        const uploaded = await postsService.uploadMedia(image)
        media.push(uploaded)
      }
    }

    // Create post with text, media URLs, and mentions
    const postData: CreatePostPayload = {
      text: payload.content,
      visibility: 'public',
    }
    if (media.length > 0) {
      postData.media = media
    }
    if (payload.mentions && payload.mentions.length > 0) {
      postData.mentions = payload.mentions
    }

    const response = await apiClient.post('/posts', postData)
    return response.data.data
  },

  // Update post - Backend uses PATCH, not PUT
  update: async (postId: string, payload: UpdatePostPayload): Promise<Post> => {
    const response = await apiClient.patch(`/posts/${postId}`, payload)
    return response.data.data
  },

  // Delete post
  delete: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`)
  },

  // Like post
  like: async (postId: string): Promise<void> => {
    await apiClient.post(`/posts/${postId}/like`)
  },

  // Unlike post
  unlike: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/like`)
  },

  // Get post comments - with robust null checks
  getComments: async (postId: string, page = 1, limit = 20): Promise<{ comments: Comment[], pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const emptyResponse = {
      comments: [] as Comment[],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`, {
        params: { page, limit },
      })

      if (!response?.data?.data) {
        return emptyResponse
      }

      const { data } = response.data
      const safeComments = Array.isArray(data.comments) ? data.comments : []

      return {
        comments: safeComments,
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting comments:', error)
      return emptyResponse
    }
  },

  // Add comment (with optional mentions) - Backend expects "text" field, NOT "content"!
  addComment: async (postId: string, text: string, mentions?: string[]): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments`, {
      text,  // WICHTIG: Backend erwartet "text", nicht "content"
      mentions: mentions && mentions.length > 0 ? mentions : undefined
    })
    return response.data.data
  },

  // Add reply to comment (with optional mentions)
  addReply: async (postId: string, commentIndex: number, text: string, mentions?: string[]): Promise<Reply> => {
    const response = await apiClient.post(`/posts/${postId}/comments/${commentIndex}/replies`, {
      text,
      mentions: mentions && mentions.length > 0 ? mentions : undefined
    })
    return response.data.data
  },

  // Delete comment
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`)
  },

  // Like comment
  likeComment: async (postId: string, commentId: string): Promise<void> => {
    await apiClient.post(`/posts/${postId}/comments/${commentId}/like`)
  },

  // Unlike comment
  unlikeComment: async (postId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}/like`)
  },

  // Toggle comment reaction (emoji) - with error handling like mobile
  toggleCommentReaction: async (postId: string, commentIndex: number, emoji: string): Promise<{ reacted: boolean; reactions: Reaction[] } | null> => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments/${commentIndex}/reactions`, { emoji })
      return response.data.data
    } catch (error) {
      console.error('Error toggling comment reaction:', error)
      return null
    }
  },

  // Toggle reply reaction (emoji) - with error handling like mobile
  toggleReplyReaction: async (postId: string, commentIndex: number, replyIndex: number, emoji: string): Promise<{ reacted: boolean; reactions: Reaction[] } | null> => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments/${commentIndex}/replies/${replyIndex}/reactions`, { emoji })
      return response.data.data
    } catch (error) {
      console.error('Error toggling reply reaction:', error)
      return null
    }
  },

  // Get comment reactions (who reacted) - with error handling like mobile
  getCommentReactions: async (postId: string, commentIndex: number): Promise<LikedByUser[]> => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments/${commentIndex}/reactions`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting comment reactions:', error)
      return []
    }
  },

  // Get reply reactions (who reacted) - with error handling like mobile
  getReplyReactions: async (postId: string, commentIndex: number, replyIndex: number): Promise<LikedByUser[]> => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments/${commentIndex}/replies/${replyIndex}/reactions`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting reply reactions:', error)
      return []
    }
  },

  // Toggle post reaction (emoji instead of like) - with error handling like mobile
  togglePostReaction: async (postId: string, emoji: string): Promise<{ reacted: boolean; reactions: Reaction[] } | null> => {
    try {
      const response = await apiClient.post(`/posts/${postId}/reactions`, { emoji })
      return response.data.data
    } catch (error) {
      console.error('Error toggling post reaction:', error)
      return null
    }
  },

  // Get post reactions (who reacted)
  getPostReactions: async (postId: string): Promise<LikedByUser[]> => {
    try {
      const response = await apiClient.get(`/posts/${postId}/reactions`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting post reactions:', error)
      return []
    }
  },

  // Get post likes (who liked)
  getPostLikes: async (postId: string): Promise<LikedByUser[]> => {
    try {
      const response = await apiClient.get(`/posts/${postId}/likes`)
      return response.data.data || []
    } catch (error) {
      console.error('Error getting post likes:', error)
      return []
    }
  },

  // Delete comment (by index, not ID)
  deleteCommentByIndex: async (postId: string, commentIndex: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentIndex}`)
  },

  // Delete reply from comment (by indices)
  deleteReplyByIndex: async (postId: string, commentIndex: number, replyIndex: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentIndex}/replies/${replyIndex}`)
  },

  getPublicFeed: async (page = 1, limit = 20): Promise<PostsResponse> => {
    const emptyResponse: PostsResponse = {
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await apiClient.get('/posts/public', {
        params: { page, limit },
      })
      if (!response?.data?.data) return emptyResponse
      const { data } = response.data
      const safePosts = Array.isArray(data.posts) ? data.posts : []
      return {
        posts: safePosts.filter((p: Post) => p && p._id),
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting public feed:', error)
      return emptyResponse
    }
  },

  // Get friends feed (posts from followed users) - like mobile app
  getFriendsFeed: async (page = 1, limit = 20): Promise<PostsResponse> => {
    const emptyResponse: PostsResponse = {
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    }
    try {
      const response = await apiClient.get('/posts/friends-feed', {
        params: { page, limit },
      })

      if (!response?.data?.data) {
        return emptyResponse
      }

      const { data } = response.data
      const safePosts = Array.isArray(data.posts) ? data.posts : []
      const validPosts = safePosts.filter((p: Post) => p && p._id)

      return {
        posts: validPosts,
        pagination: data.pagination || emptyResponse.pagination,
      }
    } catch (error) {
      console.error('Error getting friends feed:', error)
      return emptyResponse
    }
  },
}
