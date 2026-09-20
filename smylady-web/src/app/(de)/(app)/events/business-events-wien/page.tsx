import type { Metadata } from 'next'
import BusinessEventsWien from '@/views/BusinessEventsWien'
import JsonLd from '@/components/seo/JsonLd'
import { fetchBusinessEventsWien } from '@/lib/businessEventsWien'
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/businessEventsSchema'

/*
 * Die Jahreszahl im Title steht nicht mehr fest im Text. generateMetadata läuft
 * beim Erzeugen der Seite, und `revalidate` sorgt dafür, dass das auch ohne
 * Deploy geschieht — zum Jahreswechsel steht die neue Zahl damit von selbst im
 * Title, ohne dass jemand daran denken muss.
 *
 * Der Abruf der Events (fetchBusinessEventsWien) hat seinerseits revalidate 3600;
 * Next nimmt für die Route den kleineren Wert, die Seite erneuert sich also
 * stündlich.
 */
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    /*
     * OHNE " | Share Your Party": Den Brand hängt das Template im Root-Layout an
     * (src/app/(de)/layout.tsx, `template: '%s | Share Your Party'`). Stand er
     * zusätzlich hier, erschien er im ausgelieferten Title zweimal.
     */
    title: `Business- & Networking-Events in Wien ${year}`,
    description:
      'Business- & Networking-Events in Wien: Businessfrühstück, Afterwork, Speed Networking, Meetups & Konferenzen. Alle Termine laufend aktualisiert.',
    alternates: {
      canonical: 'https://shareyourparty.de/events/business-events-wien',
    },
  }
}

export default async function BusinessEventsWienPage() {
  /*
   * Serverseitig geholt, damit die strukturierten Daten im initialen HTML
   * stehen. Die Ansicht selbst holt die Events weiterhin im Client — sie ist
   * interaktiv (Aufklappen der Serientermine) und soll nach dem Laden aktuell
   * bleiben. Beide nutzen dieselben Abfrageparameter (BUSINESS_EVENTS_QUERY).
   */
  const events = await fetchBusinessEventsWien()
  const itemList = buildItemListSchema(events, 'de')

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('de')} />
      <JsonLd data={buildFaqSchema('de')} />
      {itemList && <JsonLd data={itemList} />}
      <BusinessEventsWien />
    </>
  )
}
