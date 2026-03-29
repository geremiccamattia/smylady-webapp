import { apiClient } from './api'

// Helper to get the correct memory URL (supports both old and new field names)
export function getMemoryUrl(memory: Memory): string {
  return memory.url || memory.fileUrl || ''
}

// Helper to get the correct memory type (supports both old and new field names)
export function getMemoryType(memory: Memory): 'image' | 'video' | 'text' {
  return memory.type || memory.fileType || 'image'
}

// Helper to get the correct memory ID (supports both memoryId and _id)
export function getMemoryId(memory: Memory): string {
  return memory.memoryId || memory._id || ''
}

// Helper to get the correct date (supports both uploadedAt and createdAt)
export function getMemoryDate(memory: Memory): string {
  return memory.uploadedAt || memory.createdAt || new Date().toISOString()
}

// Helper to check if memory is highlighted (supports both isHighlighted and isHighlight)
export function isMemoryHighlighted(memory: Memory): boolean {
  return memory.isHighlighted || memory.isHighlight || false
}

// Helper to get uploadedBy user info (handles both object and string/ObjectId cases)
export function getUploadedByInfo(memory: Memory): { _id: string; name: string; username?: string; profileImage?: string } {
  const uploadedBy = memory.uploadedBy

  // If it's already an object with _id
  if (typeof uploadedBy === 'object' && uploadedBy !== null && uploadedBy._id) {
    return uploadedBy
  }

  // If it's a string (ObjectId), return minimal info
  if (typeof uploadedBy === 'string') {
    return { _id: uploadedBy, name: 'User' }
  }

  // Fallback
  return { _id: '', name: 'Unknown' }
}

export interface Memory {
  // Backend uses memoryId, but API may also include _id
  _id?: string
  memoryId: string
  // Backend field is "url", not "fileUrl"
  url: string
  // Legacy field name for backward compatibility
  fileUrl?: string
  // Backend field is "type", not "fileType"
  type: 'image' | 'video' | 'text'
  // Legacy field name for backward compatibility
  fileType?: 'image' | 'video'
  text?: string
  caption?: string
  privacy: 'public' | 'private' | 'custom'
  selectedViewers?: string[]
  ticketId?: string
  // uploadedBy can be either a populated object or a string (ObjectId)
  uploadedBy: {
    _id: string
    name: string
    username?: string
    profileImage?: string
  } | string
  // Backend field is "uploadedAt", not "createdAt"
  uploadedAt: string
  createdAt?: string
  likes: string[]
  likeCount?: number
  likedByCurrentUser?: boolean
  reactions: Array<{
    emoji: string
    userId: string
    createdAt?: string
  }>
  comments: MemoryComment[]
  photoTags: Array<{
    userId: string | { _id: string; name: string; profileImage?: string }
    x: number
    y: number
    createdAt?: string
    user?: {
      _id: string
      name: string
      profileImage?: string
    }
  }>
  // Backend field is "isHighlighted", not "isHighlight"
  isHighlighted?: boolean
  isHighlight?: boolean
}

export interface MemoryComment {
  _id?: string
  text: string
  userId: {
    _id: string
    name: string
    username?: string
    profileImage?: string
  }
  mentions?: string[]
  mentionedUsers?: Array<{
    _id: string
    name: string
    username: string
  }>
  reactions?: Array<{
    emoji: string
    userId: string
  }>
  replies?: Array<{
    text: string
    userId: {
      _id: string
      name: string
      username?: string
      profileImage?: string
    }
    mentions?: string[]
    mentionedUsers?: Array<{
      _id: string
      name: string
      username: string
    }>
    reactions?: Array<{
      emoji: string
      userId: string
    }>
    createdAt: string
  }>
  createdAt: string
}

export const memoriesService = {
  // Get memories for a ticket
  async getTicketMemories(ticketId: string): Promise<Memory[]> {
    const response = await apiClient.get(`/tickets/${ticketId}/memories`)
    return response.data.data
  },

  // Get all memories for an event
  async getEventMemories(eventId: string): Promise<Memory[]> {
    const response = await apiClient.get(`/tickets/event/${eventId}/memories`)
    return response.data.data
  },

  // Upload a memory
  async uploadMemory(
    ticketId: string,
    file: File,
    caption?: string,
    privacy: 'public' | 'private' | 'custom' = 'public',
    selectedViewers?: string[]
  ): Promise<Memory> {
    const formData = new FormData()
    formData.append('file', file)

    if (caption) {
      formData.append('caption', caption)
    }

    formData.append('privacy', privacy)

    if (selectedViewers && selectedViewers.length > 0) {
      formData.append('selectedViewers', JSON.stringify(selectedViewers))
    }

    const response = await apiClient.post(`/tickets/${ticketId}/memories`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Delete a memory
  async deleteMemory(ticketId: string, memoryId: string): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}`)
  },

  // Toggle like on a memory
  async toggleLike(ticketId: string, memoryId: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/like`)
    return response.data.data
  },

  // Toggle emoji reaction on a memory
  // Backend returns { hasReacted, reactions, reactionCount }, NOT a Memory object
  async toggleReaction(ticketId: string, memoryId: string, emoji: string): Promise<{
    hasReacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
    reactionCount: number
  }> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/reactions`, { emoji })
    return response.data.data
  },

  // Add a comment to a memory
  // Backend returns the updated memory object with all comments populated
  async addComment(
    ticketId: string,
    memoryId: string,
    text: string,
    mentions?: string[]
  ): Promise<Memory> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments`,
      { text, mentions }
    )
    // Backend returns { message, data: Memory }
    return response.data.data
  },

  // Delete a comment from a memory
  async deleteComment(ticketId: string, memoryId: string, commentIndex: number): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}`)
  },

  // Add a reply to a comment
  // Backend returns the updated memory object with all comments/replies populated
  async addReply(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    text: string,
    mentions?: string[]
  ): Promise<Memory> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies`,
      { text, mentions }
    )
    // Backend returns { message, data: Memory }
    return response.data.data
  },

  // Delete a reply from a comment
  async deleteReply(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    replyIndex: number
  ): Promise<void> {
    await apiClient.delete(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies/${replyIndex}`
    )
  },

  // Toggle comment reaction
  // Backend returns { reacted, reactions }, NOT a Memory object
  async toggleCommentReaction(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    emoji: string
  ): Promise<{
    reacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
  }> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/reactions`,
      { emoji }
    )
    return response.data.data
  },

  // Toggle reply reaction
  // Backend returns { reacted, reactions }, NOT a Memory object
  async toggleReplyReaction(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    replyIndex: number,
    emoji: string
  ): Promise<{
    reacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
  }> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies/${replyIndex}/reactions`,
      { emoji }
    )
    return response.data.data
  },

  // Add a photo tag
  async addPhotoTag(
    ticketId: string,
    memoryId: string,
    taggedUserId: string,
    x: number,
    y: number
  ): Promise<Memory> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/tags`, {
      taggedUserId,
      x,
      y,
    })
    return response.data.data
  },

  // Remove a photo tag
  async removePhotoTag(ticketId: string, memoryId: string, taggedUserId: string): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}/tags/${taggedUserId}`)
  },

  // Toggle highlight status
  async toggleHighlight(ticketId: string, memoryId: string): Promise<Memory> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/highlight`)
    return response.data.data
  },

  // Get event participants (for tagging)
  async getEventParticipants(eventId: string): Promise<Array<{
    _id: string
    name: string
    username?: string
    profileImage?: string
  }>> {
    const response = await apiClient.get(`/tickets/event/${eventId}/participants`)
    return response.data.data
  },

  // Get or create organizer ticket (allows organizers to upload memories)
  // Backend returns a full ticket object with _id, we need to extract ticketId
  async getOrganizerTicket(eventId: string): Promise<{ ticketId: string }> {
    const response = await apiClient.get(`/tickets/organizer-ticket/${eventId}`)
    const ticket = response.data.data
    // Backend returns full ticket object with _id, map to { ticketId }
    return { ticketId: ticket?._id || ticket?.id || ticket?.ticketId || '' }
  },
}
