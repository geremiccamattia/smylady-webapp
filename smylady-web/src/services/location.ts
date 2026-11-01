'use client'

// Location Service for Web (Browser Geolocation API)

const STORAGE_KEYS = {
  LIVE_LOCATION_ENABLED: 'syp_live_location_enabled',
  MANUAL_LOCATION: 'syp_manual_location',
  MANUAL_LOCATIONS: 'syp_manual_locations',
  TICKETMASTER_ENABLED: 'syp_ticketmaster_enabled',
}

export interface LocationResult {
  latitude: number
  longitude: number
  description?: string
}

/**
 * Check if live location is enabled by user
 */
export const isLiveLocationEnabled = (): boolean => {
  const enabled = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LIVE_LOCATION_ENABLED) : null
  return enabled === 'true'
}

/**
 * Set live location preference
 */
export const setLiveLocationEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.LIVE_LOCATION_ENABLED, enabled ? 'true' : 'false')
}

/**
 * Check if Ticketmaster integration is enabled
 */
export const isTicketmasterEnabled = (): boolean => {
  const enabled = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TICKETMASTER_ENABLED) : null
  return enabled === 'true'
}

/**
 * Set Ticketmaster preference
 */
export const setTicketmasterEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.TICKETMASTER_ENABLED, enabled ? 'true' : 'false')
}

/**
 * Save manual location to storage
 */
export const saveManualLocation = (location: {
  lat: number
  lng: number
  description: string
}): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.MANUAL_LOCATION, JSON.stringify(location))
}

/**
 * Get saved manual location
 */
export const getManualLocation = (): {
  lat: number
  lng: number
  description: string
} | null => {
  const location = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.MANUAL_LOCATION) : null
  return location ? JSON.parse(location) : null
}

export interface SavedLocation {
  place_id: string
  lat: number
  lng: number
  description: string
}

/**
 * Mehrere Standorte für die Explore-Seite speichern. Der erste wird zusätzlich
 * als einzelner manueller Standort abgelegt — Seiten mit nur einem Standort
 * (Community-Events, Ticketmaster-Service) lesen weiter diesen.
 */
export const saveManualLocations = (locations: SavedLocation[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.MANUAL_LOCATIONS, JSON.stringify(locations))
  if (locations[0]) {
    const { lat, lng, description } = locations[0]
    saveManualLocation({ lat, lng, description })
  }
}

/**
 * Gespeicherte Standortliste der Explore-Seite, oder null, wenn keine da ist.
 */
export const getManualLocations = (): SavedLocation[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MANUAL_LOCATIONS)
    const list = raw ? JSON.parse(raw) : null
    if (!Array.isArray(list)) return null
    const valid = list.filter((l) => l && typeof l.lat === 'number' && typeof l.lng === 'number')
    return valid.length > 0 ? valid : null
  } catch {
    return null
  }
}

/**
 * Gespeicherte Standorte (einzeln und Liste) entfernen.
 */
export const clearManualLocations = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.MANUAL_LOCATIONS)
  localStorage.removeItem(STORAGE_KEYS.MANUAL_LOCATION)
}

/**
 * Get current location using Browser Geolocation API
 */
export const getCurrentLocation = (): Promise<LocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Standortzugriff wurde verweigert'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Standortinformationen nicht verfügbar'))
            break
          case error.TIMEOUT:
            reject(new Error('Zeitüberschreitung bei Standortabfrage'))
            break
          default:
            reject(new Error('Unbekannter Fehler bei Standortabfrage'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    if (result.state === 'granted') {
      return true
    } else if (result.state === 'prompt') {
      // Try to get location to trigger permission prompt
      await getCurrentLocation()
      return true
    }
    return false
  } catch {
    // Permissions API not supported, try getting location directly
    try {
      await getCurrentLocation()
      return true
    } catch {
      return false
    }
  }
}

// Bundled service export for compatibility with services/index.ts
export const locationService = {
  isLiveLocationEnabled,
  setLiveLocationEnabled,
  isTicketmasterEnabled,
  setTicketmasterEnabled,
  saveManualLocation,
  getManualLocation,
  getCurrentLocation,
  requestLocationPermission,
}
