import type { TFunction } from 'i18next'
import type { Event, PartnerInfo } from '@/types'
import { safeExternalUrl } from '@/lib/safeUrl'
import { formatPrice } from '@/lib/utils'

/**
 * Partner-Events (z.B. Secret Mission) kommen aus einem Feed, den das Backend
 * in die Events-Collection spiegelt. Sie sehen aus wie eigene Events — eigene
 * Detailseite, Favoriten, Suche —, aber gebucht wird beim Partner über
 * externalBookingUrl. Kein SYP-Ticketkauf, kein Gästelisten- oder QR-Flow.
 *
 * Abgrenzung zu Ticketmaster: Dort trägt das Event isExternalEvent/source
 * 'ticketmaster', und Karte wie Detailseite leiten direkt nach außen. Ein
 * Partner-Event hat externalSource gesetzt, aber KEIN isExternalEvent.
 */
export const DEFAULT_PARTNER_NAME = 'Secret Mission'

type PartnerLike = Pick<
  Event,
  'externalSource' | 'isExternalEvent' | 'isTicketmaster' | 'source' | 'externalBookingUrl' | 'partnerInfo' | 'price'
>

export function isPartnerEvent(event: Partial<PartnerLike> | null | undefined): boolean {
  if (!event) return false
  if (event.isExternalEvent === true || event.isTicketmaster === true || event.source === 'ticketmaster') {
    return false
  }
  return typeof event.externalSource === 'string' && event.externalSource !== ''
}

/** Name des Partners, wie er dem Nutzer gezeigt wird (Auflage des Feeds). */
export function partnerName(event: Partial<PartnerLike> | null | undefined): string {
  return event?.partnerInfo?.organizerName?.trim() || DEFAULT_PARTNER_NAME
}

/** Buchungslink — geprüft, weil daraus ein window.open() wird. */
export function partnerBookingUrl(event: Partial<PartnerLike> | null | undefined): string | null {
  return safeExternalUrl(event?.externalBookingUrl ?? undefined)
}

/** Website des Partners (Veranstalter-Block), geprüft wie der Buchungslink. */
export function partnerWebsiteUrl(event: Partial<PartnerLike> | null | undefined): string | null {
  return safeExternalUrl(event?.partnerInfo?.organizerUrl)
}

/**
 * "ab 99,90 € p. P." — aus partnerInfo.priceFrom; fällt auf event.price zurück.
 * null, wenn kein Preis bekannt ist (dann zeigt die UI "Preis auf Website").
 */
export function formatPartnerPriceFrom(
  event: Partial<PartnerLike> | null | undefined,
  t: TFunction,
): string | null {
  const info = event?.partnerInfo
  const raw = info?.priceFrom ?? event?.price
  const price = typeof raw === 'string' ? parseFloat(raw) : raw
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null
  return t('event.partnerPriceFrom', {
    defaultValue: 'ab {{price}} p. P.',
    price: formatPrice(price, info?.currency || 'EUR'),
  })
}

/** Sprachcode → Name in der UI-Sprache; unbekannte Codes groß geschrieben. */
export function partnerLanguageNames(info: PartnerInfo | null | undefined, t: TFunction): string | null {
  const codes = (info?.languages ?? []).filter(Boolean)
  if (codes.length === 0) return null
  return codes
    .map((code) => t(`event.languageNames.${code}`, { defaultValue: code.toUpperCase() }))
    .join(' / ')
}

/** Dauer: Freitext des Partners, sonst Minuten. */
export function partnerDurationLabel(info: PartnerInfo | null | undefined, t: TFunction): string | null {
  if (info?.durationText?.trim()) return info.durationText.trim()
  if (typeof info?.durationMinutes === 'number' && info.durationMinutes > 0) {
    return t('event.partnerMinutes', { defaultValue: '{{count}} Min.', count: info.durationMinutes })
  }
  return null
}

/** "3 von 8 Plätzen frei", "Keine Plätze frei" oder null, wenn der Feed nichts liefert. */
export function partnerPlacesLabel(info: PartnerInfo | null | undefined, t: TFunction): string | null {
  const free = info?.freePlaces
  if (typeof free !== 'number') return null
  if (free <= 0) return t('event.partnerNoPlaces', { defaultValue: 'Keine Plätze frei' })
  const max = info?.maxPlaces
  if (typeof max === 'number' && max > 0) {
    return t('event.partnerFreePlaces', { defaultValue: '{{free}} von {{max}} Plätzen frei', free, max })
  }
  return t('event.partnerFreePlacesOnly', {
    defaultValue_one: '{{count}} Platz frei',
    defaultValue_other: '{{count}} Plätze frei',
    defaultValue: '{{count}} Plätze frei',
    count: free,
  })
}
