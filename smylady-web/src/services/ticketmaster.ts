import { apiClient } from './api'
import { Event } from '@/types'
import { getCurrentLocation, getManualLocation } from './location'

// Default location: Vienna, Austria (used when no location is available)
const DEFAULT_LOCATION = {
  latitude: 48.2082,
  longitude: 16.3738,
}

export const ticketmasterService = {
  // Get all Ticketmaster events
  async getEvents(
    filters: Record<string, string> = {},
    upcoming: boolean = false,
    useLocation: boolean = true
  ): Promise<Event[]> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    params.append('upcoming', String(upcoming))

    // Add location parameters - required by backend
    if (useLocation && !params.has('latitude') && !params.has('longitude')) {
      try {
        // Try to get manual location first
        const manualLocation = getManualLocation()
        if (manualLocation) {
          params.append('latitude', String(manualLocation.lat))
          params.append('longitude', String(manualLocation.lng))
        } else {
          // Try browser geolocation
          try {
            const currentLocation = await getCurrentLocation()
            params.append('latitude', String(currentLocation.latitude))
            params.append('longitude', String(currentLocation.longitude))
          } catch {
            // Fallback to default location (Vienna)
            params.append('latitude', String(DEFAULT_LOCATION.latitude))
            params.append('longitude', String(DEFAULT_LOCATION.longitude))
          }
        }

        // Add default radius if not specified
        if (!params.has('radius')) {
          params.append('radius', '50') // 50km default radius
        }
      } catch {
        // Use default location as last resort
        params.append('latitude', String(DEFAULT_LOCATION.latitude))
        params.append('longitude', String(DEFAULT_LOCATION.longitude))
        params.append('radius', '50')
      }
    }

    try {
      const response = await apiClient.get(`/ticketmaster/events?${params.toString()}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error)
      return []
    }
  },
}
