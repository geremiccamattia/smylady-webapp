'use client'

import { apiClient } from './api'

export interface SpotifyTrack {
  spotifyId: string
  name: string
  artist: string
  album: string
  albumCover: string
  albumCoverSmall: string
  previewUrl: string
  spotifyUrl: string
  durationMs: number
}

export const spotifyService = {
  /**
   * Get the Spotify OAuth authorization URL
   */
  async getConnectUrl(): Promise<string> {
    const response = await apiClient.get('/auth/spotify/connect')
    return response.data.data.url
  },

  /**
   * Check whether the current user has a connected Spotify account
   */
  async getStatus(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/spotify/status')
      return response.data.data.connected || false
    } catch {
      return false
    }
  },

  /**
   * Disconnect the user's Spotify account
   */
  async disconnect(): Promise<void> {
    await apiClient.delete('/auth/spotify/disconnect')
  },

  /**
   * Search Spotify tracks by title/artist
   */
  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const response = await apiClient.get('/auth/spotify/search', {
        params: { q: query, limit: 10 },
      })
      return response.data.data || []
    } catch {
      return []
    }
  },
}
