import { apiClient } from './api'

// Report interfaces
export interface ComplaintData {
  eventId: string
  reason: string
  details?: string
}

export interface ReportMemoryData {
  ticketId: string
  memoryIndex: number
  reason: string
  details?: string
}

export interface ReportCommentData {
  ticketId: string
  memoryIndex: number
  commentIndex: number
  reason: string
  details?: string
}

export interface ReportPostData {
  postId: string
  reason: string
  details?: string
}

export interface ReportPostCommentData {
  postId: string
  commentIndex: number
  reason: string
  details?: string
}

export interface ReportPostReplyData {
  postId: string
  commentIndex: number
  replyIndex: number
  reason: string
  details?: string
}

export const complaintsService = {
  // Report an event
  async reportEvent(complaintData: ComplaintData) {
    const response = await apiClient.post('/complaints/report', complaintData)
    return response.data
  },

  // Report a memory
  async reportMemory(reportData: ReportMemoryData) {
    const response = await apiClient.post('/complaints/report-memory', reportData)
    return response.data
  },

  // Report a memory comment
  async reportComment(reportData: ReportCommentData) {
    const response = await apiClient.post('/complaints/report-comment', reportData)
    return response.data
  },

  // Report a post
  async reportPost(reportData: ReportPostData) {
    const response = await apiClient.post('/complaints/report-post', reportData)
    return response.data
  },

  // Report a post comment
  async reportPostComment(reportData: ReportPostCommentData) {
    const response = await apiClient.post('/complaints/report-post-comment', reportData)
    return response.data
  },

  // Report a post reply
  async reportPostReply(reportData: ReportPostReplyData) {
    const response = await apiClient.post('/complaints/report-post-reply', reportData)
    return response.data
  },
}
