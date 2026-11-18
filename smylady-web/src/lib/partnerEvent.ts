import type { TFunction } from 'i18next'
import type { Event, PartnerInfo, PartnerSlot } from '@/types'
import { safeExternalUrl } from '@/lib/safeUrl'
import { formatPrice } from '@/lib/utils'

const VIENNA_TIME_ZONE = 'Europe/Vienna'

/** Ein Termin, dessen Buchungslink geprüft ist und dessen Beginn ein gültiges Datum ist. */
export interface BookablePartnerSlot extends PartnerSlot {
  startDate: Date
  safeBookingUrl: string
  isFull: boolean
}

/**
 * Die noch nicht begonnenen Termine eines Partner-Angebots, nach Beginn sortiert.
 *
 * Ein Partner-Event steht für das Angebot (z.B. eine Mission), nicht für einen
 * einzelnen Termin — sonst läge dieselbe Karte je Termin in Entdecken. Die
 * Termine wählt man auf der Detailseite; jeder hat seinen eigenen Buchungslink.
 */
export function partnerSlots(
  event: { partnerInfo?: PartnerInfo | null } | null | undefined,
  now: Date = new Date(),
): BookablePartnerSlot[] {
  const result: BookablePartnerSlot[] = []
  for (const slot of event?.partnerInfo?.slots ?? []) {
    const startDate = new Date(slot.start)
    const safeBookingUrl = safeExternalUrl(slot.bookingUrl)
    if (isNaN(startDate.getTime()) || !safeBookingUrl) continue
    if (startDate.getTime() < now.getTime()) continue
    result.push({ ...slot, startDate, safeBookingUrl, isFull: slot.freePlaces === 0 })
  }
  return result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

/** Kalendertag in Wien (YYYY-MM-DD) — nicht im Gerät, sonst hinge die Gruppierung an der Uhr des Besuchers. */
const viennaDayKey = (date: Date): string => date.toLocaleDateString('en-CA', { timeZone: VIENNA_TIME_ZONE })

/** Termine nach Wiener Kalendertag gruppiert, in zeitlicher Reihenfolge. */
export function groupPartnerSlotsByDay(
  slots: BookablePartnerSlot[],
): { dayKey: string; date: Date; slots: BookablePartnerSlot[] }[] {
  const days: { dayKey: string; date: Date; slots: BookablePartnerSlot[] }[] = []
  for (const slot of slots) {
    const dayKey = viennaDayKey(slot.startDate)
    const last = days[days.length - 1]
    if (last && last.dayKey === dayKey) last.slots.push(slot)
    else days.push({ dayKey, date: slot.startDate, slots: [slot] })
  }
  return days
}

/** "Sa., 21.11.2026" in der Sprache der App, Wiener Zeit. */
export function formatPartnerSlotDay(date: Date, language: string): string {
  return date.toLocaleDateString(language.startsWith('en') ? 'en-GB' : 'de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: VIENNA_TIME_ZONE,
  })
}

/** "3 von 8 frei", "Ausgebucht" oder null, wenn der Feed keine Plätze nennt. */
export function partnerSlotPlacesLabel(slot: PartnerSlot, t: TFunction): string | null {
  const free = slot.freePlaces
  if (typeof free !== 'number') return null
  if (free <= 0) return t('event.partnerSlotFull', { defaultValue: 'Ausgebucht' })
  const max = slot.maxPlaces
  if (typeof max === 'number' && max > 0) {
    return t('event.partnerSlotFree', { defaultValue: '{{free}} von {{max}} frei', free, max })
  }
  return t('event.partnerSlotFreeOnly', { defaultValue: '{{count}} frei', count: free })
}

/** "17 Termine" — für Karte und Seitenleiste. */
export function partnerSlotCountLabel(count: number, t: TFunction): string {
  return t('event.partnerSlotCount', {
    defaultValue_one: '{{count}} Termin',
    defaultValue_other: '{{count}} Termine',
    defaultValue: '{{count}} Termine',
    count,
  })
}

/**
 * Fällt einer der Termine in den Zeitraum? Für die Datumsfilter in Entdecken:
 * Das Event selbst läuft vom ersten bis zum letzten Termin, dazwischen liegen
 * aber Tage ohne Termin. null, wenn das Event keine Terminliste hat — dann
 * entscheidet der Aufrufer wie bisher über eventStartTime.
 */
export function partnerEventInRange(
  event: { partnerInfo?: PartnerInfo | null } | null | undefined,
  from: Date,
  to: Date,
): boolean | null {
  const slots = event?.partnerInfo?.slots
  if (!slots || slots.length === 0) return null
  return slots.some((slot) => {
    const start = new Date(slot.start)
    return !isNaN(start.getTime()) && start >= from && start <= to
  })
}

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
