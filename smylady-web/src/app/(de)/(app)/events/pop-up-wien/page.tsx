import type { Metadata } from 'next'
import PopupWien from '@/views/PopupWien'
import JsonLd from '@/components/seo/JsonLd'
import { localeAlternates } from '@/lib/seo'
import { SEO, fetchPopupEventsWien } from '@/lib/popupWien'
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/popupWienSchema'

/*
 * Wie auf der Business-Events-Seite: Die Jahreszahl im Title steht nicht fest
 * im Text. generateMetadata läuft beim Erzeugen der Seite, und `revalidate`
 * sorgt dafür, dass das auch ohne Deploy geschieht — zum Jahreswechsel steht
 * die neue Zahl von selbst im Title.
 *
 * Der Abruf der Events (fetchPopupEventsWien) hat seinerseits revalidate 3600;
 * Next nimmt für die Route den kleineren Wert, die Seite erneuert sich also
 * stündlich. Bei Pop-ups zählt das mehr als anderswo: Ein abgelaufenes Pop-up
 * soll nicht tagelang in der Liste stehen bleiben.
 */
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    // Ohne " | Share Your Party" — den Brand hängt das Template im Root-Layout an.
    title: SEO.de.title(year),
    description: SEO.de.description,
    alternates: localeAlternates('/events/pop-up-wien', 'de'),
  }
}

export default async function PopupWienPage() {
  /*
   * Serverseitig geholt, damit die strukturierten Daten im initialen HTML
   * stehen. Die Ansicht holt die Events zusätzlich im Client, damit die Liste
   * nach dem Laden aktuell bleibt — beide nutzen dieselben Parameter und
   * dieselbe Auswahl (POPUP_EVENTS_QUERY, selectRunningAndUpcoming).
   */
  const events = await fetchPopupEventsWien()
  const itemList = buildItemListSchema(events, 'de')

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('de')} />
      <JsonLd data={buildFaqSchema('de')} />
      {itemList && <JsonLd data={itemList} />}
      <PopupWien />
    </>
  )
}
