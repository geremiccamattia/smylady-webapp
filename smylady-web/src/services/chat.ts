import { apiClient } from './api'
import { ChatRoom, ChatMessagesResponse, ChatMessage } from '@/types'

export interface Message {
  id?: string
  _id?: string
  content: string
  senderId?: { _id?: string; id?: string; name?: string } | string
  receiverId?: string
  file?: string
  createdAt: string
  referenceId?: string
}

export const chatService = {
  // Get all conversations (chat rooms)
  async getConversations(): Promise<ChatRoom[]> {
    const response = await apiClient.get('/chat/chat-rooms')
    return response.data.data || []
  },

  // Get messages for a chat room
  async getMessages(roomId: string): Promise<ChatMessagesResponse> {
    const response = await apiClient.get(`/chat/${roomId}`)
    return response.data.data
  },

  // Get or create chat room with user
  async getOrCreateRoom(receiverId: string): Promise<ChatRoom> {
    const response = await apiClient.post('/chat/room', { receiverId })
    return response.data.data
  },

  // Send text message (legacy)
  async sendTextMessage(receiverId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.post('/chat', {
      receiverId,
      content,
    })
    return response.data.data
  },

  // Send image message (legacy)
  async sendImageMessage(receiverId: string, file: File): Promise<ChatMessage> {
    const formData = new FormData()
    formData.append('receiverId', receiverId)
    formData.append('content', '')
    formData.append('file', file)

    const response = await apiClient.post('/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  // Mark messages as read
  async markAsRead(roomId: string): Promise<void> {
    await apiClient.patch(`/chat/${roomId}/read`)
  },

  // Delete chat room
  async deleteRoom(roomId: string): Promise<void> {
    await apiClient.delete(`/chat/${roomId}`)
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/message/${messageId}`)
  },

  // Ensure chat room exists (creates if not)
  async ensureChatRoom(recipientId: string): Promise<{ roomId: string }> {
    const response = await apiClient.post('/chat/ensure-room', { recipientId })
    return response.data.data
  },

  // Get chat room by ID
  async getChatRoomById(roomId: string): Promise<ChatRoom & { messages: Message[] }> {
    const response = await apiClient.get(`/chat/${roomId}`)
    return response.data.data
  },

  // Send message with optional file
  async sendMessage(receiverId: string, content: string, file?: File): Promise<ChatMessage> {
    if (file) {
      const formData = new FormData()
      formData.append('receiverId', receiverId)
      formData.append('content', content)
      formData.append('file', file)

      const response = await apiClient.post('/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    }

    const response = await apiClient.post('/chat', { receiverId, content })
    return response.data.data
  },

  // Delete chat
  async deleteChat(roomId: string): Promise<void> {
    await apiClient.delete(`/chat/${roomId}`)
  },

  // Update message - like mobile app
  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.patch(`/chat/message/${messageId}`, { content })
    return response.data.data
  },
}
