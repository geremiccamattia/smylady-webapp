import { apiClient } from './api'

export const communityService = {
  getAll: async (category?: string, search?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (search) params.append('search', search)
    params.append('page', String(page))
    params.append('limit', String(limit))
    const response = await apiClient.get(`/communities?${params}`)
    return response.data.data
  },

  getTopPicks: async (limit = 3) => {
    // /communities/top-picks ist auth-pflichtig (401 im Gast-Modus, z.B. auf
    // /explore). Wie bei eventsService.getRecentMemories/getTopPicks: Fehler
    // abfangen und leeres Array liefern, statt die Anfrage React Query dreimal
    // wiederholen zu lassen (Default-Retry) und den Rest der Seite zu stören.
    try {
      const response = await apiClient.get(`/communities/top-picks?limit=${limit}`)
      return response.data.data
    } catch {
      return []
    }
  },

  getMyCommunities: async () => {
    const response = await apiClient.get('/communities/my-communities')
    return response.data.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/communities/${id}`)
    return response.data.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/communities', data)
    return response.data.data
  },

  createWithFiles: async (data: FormData) => {
    const response = await apiClient.post('/communities', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  join: async (id: string) => {
    const response = await apiClient.post(`/communities/${id}/join`)
    return response.data.data
  },

  leave: async (id: string) => {
    const response = await apiClient.post(`/communities/${id}/leave`)
    return response.data.data
  },

  getPosts: async (id: string, page = 1, limit = 20) => {
    const response = await apiClient.get(`/communities/${id}/posts?page=${page}&limit=${limit}`)
    return response.data.data
  },

  getEvents: async (id: string, params?: { latitude?: number; longitude?: number; radius?: number; date?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.latitude) searchParams.append('latitude', String(params.latitude))
    if (params?.longitude) searchParams.append('longitude', String(params.longitude))
    if (params?.radius) searchParams.append('radius', String(params.radius))
    if (params?.date) searchParams.append('date', params.date)
    const response = await apiClient.get(`/communities/${id}/events?${searchParams}`)
    return response.data.data
  },

  getMembers: async (id: string, page = 1, limit = 20) => {
    const response = await apiClient.get(`/communities/${id}/members?page=${page}&limit=${limit}`)
    return response.data.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/communities/${id}`, data)
    return response.data.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/communities/${id}`)
    return response.data.data
  },

  getJoinRequests: async (id: string) => {
    const response = await apiClient.get(`/communities/${id}/join-requests`)
    return response.data.data
  },

  handleJoinRequest: async (id: string, userId: string, action: 'approve' | 'reject') => {
    const response = await apiClient.patch(`/communities/${id}/join-requests/${userId}`, { action })
    return response.data.data
  },

  toggleAdmin: async (id: string, userId: string) => {
    const response = await apiClient.patch(`/communities/${id}/admins/${userId}`)
    return response.data.data
  },

  updateSettings: async (id: string, settings: { requireApproval?: boolean; allowMemberEvents?: boolean }) => {
    const response = await apiClient.patch(`/communities/${id}/settings`, settings)
    return response.data.data
  },

  removeMember: async (communityId: string, userId: string) => {
    const response = await apiClient.delete(`/communities/${communityId}/members/${userId}`)
    return response.data.data
  },
}
