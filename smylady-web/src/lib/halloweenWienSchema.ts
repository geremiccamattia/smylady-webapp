import { SITE_URL } from '@/lib/seo'
import { FAQS, OWN_EVENTS, PAGE_PATH, type PageLocale } from '@/lib/halloweenWien'

/**
 * Strukturierte Daten der Seite /events/halloween-wien.
 *
 * Gebaut auf dem Server und über components/seo/JsonLd.tsx ausgegeben — wie bei
 * der Business-Events-Seite. Die FAQ-Texte kommen aus derselben Konstante, aus
 * der auch das Accordion gerendert wird.
 *
 * BEWUSST OHNE Event-Schema: Die gelisteten Events haben eigene Detailseiten
 * mit eigenem Event-Markup — dieselben Veranstaltungen hier noch einmal als
 * Event auszuzeichnen, würde sie doppelt melden. Die ItemList führt deshalb nur
 * Name und URL.
 */

type JsonLdObject = Record<string, unknown>

function pageUrl(locale: PageLocale): string {
  return locale === 'en' ? `${SITE_URL}/en${PAGE_PATH}` : `${SITE_URL}${PAGE_PATH}`
}

/** Absolute URL zu einer Eventseite. Die Daten halten den Pfad relativ. */
function absoluteEventUrl(path: string, locale: PageLocale): string {
  return locale === 'en' ? `${SITE_URL}/en${path}` : `${SITE_URL}${path}`
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

export function buildBreadcrumbSchema(locale: PageLocale): JsonLdObject {
  /*
   * Start → Events → Halloween in Wien.
   *
   * „Start" zeigt in beiden Sprachen auf die Site-Wurzel: Eine eigene
   * /en-Startseite gibt es nicht (nur src/app/(de)/page.tsx), ein Verweis auf
   * /en liefe ins Leere.
   */
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'en' ? 'Home' : 'Start',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Events',
        item: locale === 'en' ? `${SITE_URL}/en/explore` : `${SITE_URL}/explore`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: locale === 'en' ? 'Halloween in Vienna' : 'Halloween in Wien',
        item: pageUrl(locale),
      },
    ],
  }
}

/**
 * Die eigenen Events, in der Reihenfolge der Übersichtstabelle.
 *
 * Nur Name und URL — siehe Kopf dieser Datei.
 */
export function buildItemListSchema(locale: PageLocale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'en' ? 'Halloween events in Vienna' : 'Halloween-Events in Wien',
    url: pageUrl(locale),
    numberOfItems: OWN_EVENTS.length,
    itemListElement: OWN_EVENTS.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.name,
      url: absoluteEventUrl(event.eventUrl as string, locale),
    })),
  }
}
