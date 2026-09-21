import { SITE_URL } from '@/lib/seo'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import { parseNominatimAddress } from '@/lib/eventSchema'
import {
  FAQS,
  groupEventsBySeries,
  type BusinessEvent,
  type EventSeriesGroup,
  type PageLocale,
} from '@/lib/businessEventsWien'

/**
 * Strukturierte Daten der Seite /events/business-events-wien.
 *
 * Gebaut auf dem Server und über components/seo/JsonLd.tsx ausgegeben. Die
 * FAQ-Texte kommen aus derselben Konstante, aus der auch das Accordion
 * gerendert wird — doppelte Pflege wäre eine sichere Quelle für Abweichungen
 * zwischen sichtbarem Text und Auszeichnung.
 */

type JsonLdObject = Record<string, unknown>

function pagePath(locale: PageLocale): string {
  return locale === 'en'
    ? `${SITE_URL}/en/events/business-events-wien`
    : `${SITE_URL}/events/business-events-wien`
}

function eventUrl(event: BusinessEvent, locale: PageLocale): string {
  const id = event._id || event.id || ''
  const slug = event.name ? generateEventSlug(event.name, id) : id
  return locale === 'en' ? `${SITE_URL}/en/event/${slug}` : `${SITE_URL}/event/${slug}`
}

/** Gültiger ISO-Zeitpunkt oder null — ein geratenes Datum wäre schlimmer als keines. */
function toIsoOrNull(value?: string | null): string | null {
  if (!value) return null
  if (/^\d{1,2}:\d{2}$/.test(String(value).trim())) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function organizerOf(event: BusinessEvent): JsonLdObject | null {
  const raw = event.userId ?? event.creator
  if (!raw || typeof raw === 'string' || !raw.name) return null

  const organizer: JsonLdObject = { '@type': 'Organization', name: raw.name }
  if (raw._id) organizer.url = `${SITE_URL}/user/${raw._id}`
  return organizer
}

function locationOf(event: BusinessEvent): JsonLdObject {
  const address = parseNominatimAddress(event.locationName)

  const postalAddress: JsonLdObject = { '@type': 'PostalAddress' }
  if (address.streetAddress) postalAddress.streetAddress = address.streetAddress
  if (address.postalCode) postalAddress.postalCode = address.postalCode
  // Rückfall auf Wien: Die Seite listet ausschließlich Events im Umkreis von Wien.
  postalAddress.addressLocality = address.addressLocality || 'Wien'
  postalAddress.addressCountry = address.addressCountry || 'AT'

  return {
    '@type': 'Place',
    name: address.venueName || address.addressLocality || event.locationName || 'Wien',
    address: postalAddress,
  }
}

function offersOf(event: BusinessEvent, locale: PageLocale): JsonLdObject {
  return {
    '@type': 'Offer',
    price: event.price ?? 0,
    priceCurrency: 'EUR',
    availability:
      event.soldOut === true ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    url: eventUrl(event, locale),
  }
}

/**
 * Ein Event-Objekt je SERIE, nicht je Termin.
 *
 * Die weiteren Termine hängen an `eventSchedule`. Ein eigener Eintrag je Termin
 * würde dieselbe Veranstaltung mehrfach als eigenständiges Event ausweisen.
 */
function eventSchemaFromGroup(group: EventSeriesGroup, locale: PageLocale): JsonLdObject | null {
  const event = group.primary
  const startDate = toIsoOrNull(event.eventStartTime) || toIsoOrNull(event.eventDate)
  if (!event.name || !startDate) return null

  const schema: JsonLdObject = {
    '@type': 'BusinessEvent',
    name: event.name,
    startDate,
    url: eventUrl(event, locale),
    location: locationOf(event),
    eventStatus:
      String(event.status).toLowerCase() === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    offers: offersOf(event, locale),
  }

  const endDate = toIsoOrNull(event.eventEndTime)
  if (endDate && endDate > startDate) schema.endDate = endDate

  const description = stripMarkdown(event.description)
  if (description) schema.description = description

  const image = event.locationImages?.[0]?.url || event.thumbnailUrl
  if (image) schema.image = [image]

  const organizer = organizerOf(event)
  if (organizer) schema.organizer = organizer

  // Weitere Termine der Serie.
  const furtherDates = group.occurrences
    .slice(1)
    .map(occurrence => toIsoOrNull(occurrence.eventStartTime) || toIsoOrNull(occurrence.eventDate))
    .filter((value): value is string => value !== null)

  if (furtherDates.length > 0) {
    schema.eventSchedule = furtherDates.map(date => ({
      '@type': 'Schedule',
      startDate: date,
    }))
  }

  return schema
}

export function buildBreadcrumbSchema(locale: PageLocale): JsonLdObject {
  // Entspricht dem sichtbaren Breadcrumb „Österreich · Wien" im Kopf der Seite.
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'en' ? 'Austria' : 'Österreich',
        item: locale === 'en' ? `${SITE_URL}/en/explore` : `${SITE_URL}/explore`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'en' ? 'Vienna' : 'Wien',
        item: locale === 'en' ? `${SITE_URL}/en/events/wien` : `${SITE_URL}/events/wien`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name:
          locale === 'en'
            ? 'Business & Networking Events'
            : 'Business- & Networking-Events',
        item: pagePath(locale),
      },
    ],
  }
}

export function buildFaqSchema(locale: PageLocale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS[locale].map(entry => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  }
}

/** null, wenn keine Events vorliegen — eine leere ItemList hilft niemandem. */
export function buildItemListSchema(
  events: BusinessEvent[],
  locale: PageLocale,
): JsonLdObject | null {
  const groups = groupEventsBySeries(events)
  const items = groups
    .map(group => eventSchemaFromGroup(group, locale))
    .filter((value): value is JsonLdObject => value !== null)

  if (items.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name:
      locale === 'en'
        ? 'Business & networking events in Vienna'
        : 'Business- & Networking-Events in Wien',
    url: pagePath(locale),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item,
    })),
  }
}
