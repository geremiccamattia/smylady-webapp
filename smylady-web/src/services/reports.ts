import { apiClient } from './api'

export type ReportType =
  | 'memory'
  | 'memory_comment'
  | 'post'
  | 'post_comment'
  | 'user'
  | 'event'

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'violence'
  | 'hate_speech'
  | 'nudity'
  | 'copyright'
  | 'other'

export interface CreateReportPayload {
  type: ReportType
  reason: ReportReason
  details?: string
  // For memory/comment reports
  ticketId?: string
  eventId?: string
  memoryIndex?: number
  commentId?: string
  // For post reports
  postId?: string
  // For user reports
  reportedUserId?: string
}

export interface Report {
  _id: string
  reporterId: string
  type: ReportType
  reason: ReportReason
  details?: string
  ticketId?: string
  eventId?: string
  memoryIndex?: number
  commentId?: string
  postId?: string
  reportedUserId?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: string
  updatedAt: string
}

export const reportsService = {
  // Create a report
  async createReport(payload: CreateReportPayload): Promise<Report> {
    const response = await apiClient.post('/reports', payload)
    return response.data.data
  },

  // Get user's submitted reports
  async getMyReports(): Promise<Report[]> {
    const response = await apiClient.get('/reports/my-reports')
    return response.data.data
  },
}
