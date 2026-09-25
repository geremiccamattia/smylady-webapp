'use client'

// API Configuration
export const CONFIG = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://smylady-backend.onrender.com',
  STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
}

// Storage Keys (localStorage)
export const STORAGE_KEYS = {
  TOKEN: 'syp_token',
  USER: 'syp_user',
  REMEMBER_ME: 'syp_remember_me',
} as const

// Event Categories - MUST match backend EventCategory enum (src/types/common.ts)
//
// 'Other' steht bewusst am Ende: Mehrere Listen hängen an dieser Reihenfolge
// (Explore-Chips, Interests-Raster, das Select in EditEvent), und „Sonstiges"
// gehört überall hinter die konkreten Kategorien.
//
// 'Yoga' ist aus dem Event-Enum entfallen und wird für Events nicht mehr
// angeboten. Bestandsevents mit dieser Kategorie zeigen weiterhin ihren Rohwert
// an (EventCard, Detailseite) und behalten ihn beim Bearbeiten — siehe
// EditEvent. Für Communities bleibt die Kategorie gültig, siehe
// COMMUNITY_ONLY_CATEGORIES weiter unten.
export const EVENT_CATEGORIES = [
  { value: 'Music', label: 'Musik' },
  { value: 'Nature', label: 'Outdoor' },
  { value: 'Theme', label: 'Themenparty' },
  { value: 'On the Roof', label: 'Rooftop' },
  { value: 'Clubbing', label: 'Clubbing' },
  { value: 'Gastronomy', label: 'Gastronomie' },
  { value: 'Business', label: 'Business' },
  { value: 'Sports', label: 'Sport' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Popup', label: 'Pop-up' },
  { value: 'Other', label: 'Sonstiges' },
] as const

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number]['value']

/** Eine Kategorie so, wie die Oberflächen sie brauchen — Wert plus Label. */
export type EventCategory = { value: string; label: string }

/**
 * Dieselben Kategorien in einer abweichenden Reihenfolge.
 *
 * Der Parametertyp ist der Union der Werte: Ein Tippfehler in einer der Listen
 * unten ist damit ein Compile-Fehler und kein stilles Verschwinden — die
 * Community-Chips filterten einen unbekannten Wert bisher kommentarlos weg.
 * Deshalb ist das `!` hier sicher.
 */
function orderedCategories(
  order: readonly EventCategoryValue[],
): readonly EventCategory[] {
  return order.map((value) => EVENT_CATEGORIES.find((c) => c.value === value)!)
}

/**
 * Reihenfolge im Anlegen-Formular.
 *
 * Weicht bewusst von der Reihenfolge oben ab — sie ist dort historisch
 * gewachsen und unverändert übernommen, damit sich am Dropdown nichts ändert.
 */
export const EVENT_FORM_CATEGORIES = orderedCategories([
  'Music', 'Gastronomy', 'Nature', 'Business', 'On the Roof',
  'Theme', 'Sports', 'Clubbing', 'Workshop', 'Popup', 'Other',
])

/**
 * HIER LAUFEN DIE BEIDEN LISTEN AUSEINANDER — Yoga: nur Communities, für
 * Events nicht mehr angeboten.
 *
 * Das Backend-Enum EventCategory kennt Yoga nicht mehr, deshalb steht die
 * Kategorie nicht in EVENT_CATEGORIES und taucht weder im Anlegen-Formular
 * (EVENT_FORM_CATEGORIES) noch in den Event-Filtern, den Onboarding-Interessen
 * oder der Bulk-Upload-Doku auf. Für Communities bleibt sie gültig: Zwei
 * Bestands-Communities tragen sie, und sie sollen sie behalten und abwählen
 * können.
 */
const COMMUNITY_ONLY_CATEGORIES = [
  { value: 'Yoga', label: 'Yoga' },
] as const

type CommunityCategoryValue =
  | EventCategoryValue
  | (typeof COMMUNITY_ONLY_CATEGORIES)[number]['value']

/** Wie orderedCategories, zusätzlich mit den Community-eigenen Kategorien. */
function orderedCommunityCategories(
  order: readonly CommunityCategoryValue[],
): readonly EventCategory[] {
  const pool: readonly EventCategory[] = [
    ...EVENT_CATEGORIES,
    ...COMMUNITY_ONLY_CATEGORIES,
  ]
  return order.map((value) => pool.find((c) => c.value === value)!)
}

/**
 * Kategorien für Communities.
 *
 * Communities teilen sich das Vokabular weitgehend mit Events; abweichend sind
 * die Reihenfolge (nach Beliebtheit der Community-Themen) und Yoga, siehe oben.
 * Soll eine Eventkategorie für Communities nicht angeboten werden, wird sie
 * hier weggelassen.
 */
export const COMMUNITY_CATEGORIES = orderedCommunityCategories([
  'Music', 'Clubbing', 'Business', 'Nature', 'Sports',
  'Workshop', 'Gastronomy', 'Yoga', 'Popup', 'Theme', 'On the Roof', 'Other',
])

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
  { value: 'indie', label: 'Indie' },
  { value: 'dnb', label: 'Drum & Bass' },
] as const

// Age Restrictions
export const AGE_RESTRICTIONS = [
  { value: 0, label: 'Keine Altersbeschränkung' },
  { value: 16, label: 'Ab 16 Jahren' },
  { value: 18, label: 'Ab 18 Jahren' },
  { value: 21, label: 'Ab 21 Jahren' },
] as const
