// API Configuration
export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'https://smylady-backend.onrender.com',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://smylady-backend.onrender.com',
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
}

// Storage Keys (localStorage)
export const STORAGE_KEYS = {
  TOKEN: 'syp_token',
  USER: 'syp_user',
  REMEMBER_ME: 'syp_remember_me',
} as const

// Event Categories - MUST match backend EventCategory enum (src/types/common.ts)
export const EVENT_CATEGORIES = [
  { value: 'Music', label: 'Musik' },
  { value: 'Concert', label: 'Konzert' },
  { value: 'Nature', label: 'Outdoor' },
  { value: 'Theme', label: 'Themenparty' },
  { value: 'On the Roof', label: 'Rooftop' },
  { value: 'Ship', label: 'Schiff' },
  { value: 'Gastronomy', label: 'Gastronomie' },
  { value: 'Business', label: 'Business' },
  { value: 'Sports', label: 'Sport' },
  { value: 'Other', label: 'Sonstiges' },
] as const

// Music Types
export const MUSIC_TYPES = [
  { value: 'electronic', label: 'Electronic' },
  { value: 'house', label: 'House' },
  { value: 'techno', label: 'Techno' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'rnb', label: 'R&B' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'latin', label: 'Latin' },
  { value: 'mixed', label: 'Mixed' },
] as const

// Age Restrictions
export const AGE_RESTRICTIONS = [
  { value: 0, label: 'Keine Altersbeschränkung' },
  { value: 16, label: 'Ab 16 Jahren' },
  { value: 18, label: 'Ab 18 Jahren' },
  { value: 21, label: 'Ab 21 Jahren' },
] as const
