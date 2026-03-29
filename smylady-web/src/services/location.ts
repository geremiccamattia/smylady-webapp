// Location Service for Web (Browser Geolocation API)

const STORAGE_KEYS = {
  LIVE_LOCATION_ENABLED: 'syp_live_location_enabled',
  MANUAL_LOCATION: 'syp_manual_location',
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
  const enabled = localStorage.getItem(STORAGE_KEYS.LIVE_LOCATION_ENABLED)
  return enabled === 'true'
}

/**
 * Set live location preference
 */
export const setLiveLocationEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.LIVE_LOCATION_ENABLED, enabled ? 'true' : 'false')
}

/**
 * Check if Ticketmaster integration is enabled
 */
export const isTicketmasterEnabled = (): boolean => {
  const enabled = localStorage.getItem(STORAGE_KEYS.TICKETMASTER_ENABLED)
  return enabled === 'true'
}

/**
 * Set Ticketmaster preference
 */
export const setTicketmasterEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.TICKETMASTER_ENABLED, enabled ? 'true' : 'false')
}

/**
 * Save manual location to storage
 */
export const saveManualLocation = (location: {
  lat: number
  lng: number
  description: string
}): void => {
  localStorage.setItem(STORAGE_KEYS.MANUAL_LOCATION, JSON.stringify(location))
}

/**
 * Get saved manual location
 */
export const getManualLocation = (): {
  lat: number
  lng: number
  description: string
} | null => {
  const location = localStorage.getItem(STORAGE_KEYS.MANUAL_LOCATION)
  return location ? JSON.parse(location) : null
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
