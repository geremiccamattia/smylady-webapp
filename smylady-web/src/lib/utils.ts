import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CONFIG } from '@/lib/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve image URL - same logic as mobile app's resolveImageUrl
 * Handles: full URLs (return as-is), relative paths (prepend API base URL),
 * objects with url property, local file URLs, empty/null (return undefined)
 */
export function resolveImageUrl(url?: string | { url?: string } | null): string | undefined {
  if (!url) return undefined

  // Handle object with url property (e.g., locationImages from backend)
  // Mobile app supports this, web app must too
  if (typeof url === 'object' && url !== null) {
    const urlString = (url as { url?: string }).url
    if (!urlString) return undefined
    return resolveImageUrl(urlString)
  }

  // Reject local file:// or content:// URLs (not valid in web browser)
  if (url.startsWith('file://') || url.startsWith('content://')) {
    console.warn('Local file URL detected, media not properly uploaded:', url.substring(0, 50))
    return undefined
  }

  // Already a full URL - return as-is
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
    return url
  }

  // Relative path - prepend API base URL
  const baseUrl = CONFIG.API_URL?.replace(/\/$/, '') ?? ''
  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${baseUrl}${normalizedPath}`
}

/**
 * Safely format a date string to locale date. Returns null if date is invalid.
 */
export function safeFormatDate(dateString?: string | null, options?: Intl.DateTimeFormatOptions): string | null {
  if (!dateString) return null
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-DE', options || { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format event time - handles both ISO strings and HH:mm format
 * Returns time in HH:mm format (e.g., "19:00")
 */
export function formatEventTime(time: string | null | undefined): string {
  if (!time) return '--:--'

  // If already in HH:mm format, return as-is
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    return time
  }

  // If ISO date string (contains T or Z), parse and format
  if (time.includes('T') || time.includes('Z')) {
    try {
      const d = new Date(time)
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    } catch {
      // Fall through to return original
    }
  }

  return time
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function formatPrice(price: number | string | undefined | null, currency: string = 'EUR'): string {
  // Convert string prices to number (backend may send price as string)
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  // Handle undefined, null, or NaN as "Kostenlos"
  if (numericPrice === undefined || numericPrice === null || isNaN(numericPrice)) {
    return 'Kostenlos'
  }
  // Format all valid numbers including 0 as currency
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(numericPrice)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getInitials(name: string | undefined | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateEventSlug(name: string, id: string): string {
  const umlautMap: Record<string, string> = {
    ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  }
  const slug = name
    .toLowerCase()
    .replace(/[äöüß]/g, c => umlautMap[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  const shortId = id.slice(-8)
  return `${slug}-${shortId}`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Gerade eben'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Vor ${diffInMinutes} Min.`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Vor ${diffInHours} Std.`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `Vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`
  }

  // Fallback to date format
  return formatDate(date)
}
