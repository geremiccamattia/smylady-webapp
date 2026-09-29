import { SITE_URL } from '@/lib/seo'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import { parseNominatimAddress } from '@/lib/eventSchema'
import {
  BREADCRUMB,
  FAQS,
  PAGE_PATH,
  type PageLocale,
  type PopupEvent,
} from '@/lib/popupWien'

/**
 * Strukturierte Daten der Seite /events/pop-up-wien.
 *
 * Gebaut auf dem Server und über components/seo/JsonLd.tsx ausgegeben — wie auf
 * der Business-Events-Seite. Die FAQ-Texte kommen aus derselben Konstante, aus
 * der auch das Accordion gerendert wird; doppelte Pflege wäre eine sichere
 * Quelle für Abweichungen zwischen sichtbarem Text und Auszeichnung.
 */

type JsonLdObject = Record<string, unknown>

function pageUrl(locale: PageLocale): string {
  return locale === 'en' ? `${SITE_URL}/en${PAGE_PATH}` : `${SITE_URL}${PAGE_PATH}`
}

function eventUrl(event: PopupEvent, locale: PageLocale): string {
  const id = event._id || event.id || ''
  const slug = event.name ? generateEventSlug(event.name, id) : id
  return locale === 'en' ? `${SITE_URL}/en/event/${slug}` : `${SITE_URL}/event/${slug}`
}

/** Gültiger ISO-Zeitpunkt oder null — ein geratenes Datum wäre schlimmer als keines. */
function toIsoOrNull(value?: string | null): string | null {
  if (!value) return null
  // Eine nackte Uhrzeit ("19:00") ergibt ein Invalid Date.
  if (/^\d{1,2}:\d{2}$/.test(String(value).trim())) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function organizerOf(event: PopupEvent): JsonLdObject | null {
  const raw = event.userId ?? event.creator
  if (!raw || typeof raw === 'string' || !raw.name) return null

  const organizer: JsonLdObject = { '@type': 'Organization', name: raw.name }
  if (raw._id) organizer.url = `${SITE_URL}/user/${raw._id}`
  return organizer
}

function locationOf(event: PopupEvent): JsonLdObject {
  const address = parseNominatimAddress(event.locationName)

  const postalAddress: JsonLdObject = { '@type': 'PostalAddress' }
  if (address.streetAddress) postalAddress.streetAddress = address.streetAddress
  if (address.postalCode) postalAddress.postalCode = address.postalCode
  // Rückfall auf Wien: Die Seite listet ausschließlich Pop-ups im Umkreis von Wien.
  postalAddress.addressLocality = address.addressLocality || 'Wien'
  postalAddress.addressCountry = address.addressCountry || 'AT'

  return {
    '@type': 'Place',
    name: address.venueName || address.addressLocality || event.locationName || 'Wien',
    address: postalAddress,
  }
}

/**
 * Preisangabe.
 *
 * `price` als String und immer gesetzt: Bei kostenlosen Pop-ups erzeugt "0" mit
 * priceCurrency "EUR" im Snippet die Auszeichnung „Kostenlos" — genau der Fall,
 * der bei Pop-up Stores und Brand-Pop-ups die Regel ist.
 */
function offersOf(event: PopupEvent, locale: PageLocale): JsonLdObject {
  return {
    '@type': 'Offer',
    price: String(event.price ?? 0),
    priceCurrency: 'EUR',
    availability:
      event.soldOut === true ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    url: eventUrl(event, locale),
  }
}

/**
 * Ein Event-Objekt je Pop-up, mit `startDate` und `endDate` über den gesamten
 * Zeitraum.
 *
 * Kein Eintrag je Tag: Ein mehrwöchiges Pop-up ist eine Veranstaltung mit
 * Laufzeit, keine Serie von Einzelterminen. `endDate` wird nur gesetzt, wenn es
 * nach dem Start liegt — bei Events ohne brauchbares Enddatum bleibt es weg,
 * statt einen erfundenen Zeitpunkt auszuweisen.
 */
function eventSchemaOf(event: PopupEvent, locale: PageLocale): JsonLdObject | null {
  const startDate = toIsoOrNull(event.eventStartTime) || toIsoOrNull(event.eventDate)
  if (!event.name || !startDate) return null

  const schema: JsonLdObject = {
    '@type': 'Event',
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

  return schema
}

/** Entspricht dem sichtbaren Breadcrumb „Österreich › Wien › Pop-up". */
export function buildBreadcrumbSchema(locale: PageLocale): JsonLdObject {
  const labels = BREADCRUMB[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.country,
        item: locale === 'en' ? `${SITE_URL}/en/explore` : `${SITE_URL}/explore`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.city,
        item: locale === 'en' ? `${SITE_URL}/en/events/wien` : `${SITE_URL}/events/wien`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: labels.page,
        item: pageUrl(locale),
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

/** null, wenn keine Pop-ups vorliegen — eine leere ItemList hilft niemandem. */
export function buildItemListSchema(
  events: PopupEvent[],
  locale: PageLocale,
): JsonLdObject | null {
  const items = events
    .map(event => eventSchemaOf(event, locale))
    .filter((value): value is JsonLdObject => value !== null)

  if (items.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'en' ? 'Pop-ups in Vienna' : 'Pop-ups in Wien',
    url: pageUrl(locale),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item,
    })),
  }
}
