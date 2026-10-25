import { SITE_URL } from '@/lib/seo'
import { PAGE_PATH, tx, type MarketModel, type PageLocale, type PageModel } from '@/lib/weihnachtenWien'

/**
 * Strukturierte Daten der Seite /events/weihnachtsmaerkte-wien.
 *
 * Alles aus demselben Seitenmodell (buildPageModel), aus dem auch die View
 * rendert — FAQ-Antworten, Märkte und Breadcrumb können so nicht vom
 * sichtbaren Text abweichen.
 *
 * Anders als bei Halloween MIT Event-Objekten in der ItemList (Vorgabe): je
 * Markt name, startDate, endDate, location mit Adresse, url und — bei freiem
 * Eintritt — offers mit Preis 0. Aufbau der Event-Objekte wie auf der
 * Pop-up-Seite (lib/popupWienSchema.ts).
 */

type JsonLdObject = Record<string, unknown>

function pageUrl(locale: PageLocale): string {
  return locale === 'en' ? `${SITE_URL}/en${PAGE_PATH}` : `${SITE_URL}${PAGE_PATH}`
}

function absolute(path: string, locale: PageLocale): string {
  return locale === 'en' ? `${SITE_URL}/en${path}` : `${SITE_URL}${path}`
}

/** Entspricht dem sichtbaren Breadcrumb „Österreich / Wien / Weihnachtsmärkte" — wie bei Pop-up. */
export function buildBreadcrumbSchema(locale: PageLocale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tx(locale, 'breadcrumb.country'), item: absolute('/explore', locale) },
      { '@type': 'ListItem', position: 2, name: tx(locale, 'breadcrumb.city'), item: absolute('/events/wien', locale) },
      { '@type': 'ListItem', position: 3, name: tx(locale, 'breadcrumb.page'), item: pageUrl(locale) },
    ],
  }
}

export function buildFaqSchema(model: PageModel): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: model.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

function eventSchemaOf(market: MarketModel, locale: PageLocale): JsonLdObject {
  const url = absolute(market.path, locale)
  const address: JsonLdObject = { '@type': 'PostalAddress', addressLocality: 'Wien', addressCountry: 'AT' }
  if (market.schema.streetAddress) address.streetAddress = market.schema.streetAddress
  if (market.schema.postalCode) address.postalCode = market.schema.postalCode

  const event: JsonLdObject = {
    '@type': 'Event',
    name: market.name,
    startDate: market.schema.startIso,
    url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: market.venue, address },
  }
  if (market.schema.endIso) event.endDate = market.schema.endIso
  if (market.schema.description) event.description = market.schema.description
  if (market.schema.image) event.image = [market.schema.image]
  if (market.free) {
    event.isAccessibleForFree = true
    event.offers = { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url }
  }
  return event
}

/** Alle Märkte in der Reihenfolge der Übersichtstabelle. null ohne Märkte. */
export function buildItemListSchema(model: PageModel): JsonLdObject | null {
  if (model.markets.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: tx(model.locale, 'schema.itemListName', { year: model.year }),
    url: pageUrl(model.locale),
    numberOfItems: model.markets.length,
    itemListElement: model.markets.map((market, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: eventSchemaOf(market, model.locale),
    })),
  }
}
