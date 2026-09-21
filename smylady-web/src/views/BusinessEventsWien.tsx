'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import { useLocalePath } from '@/hooks/useLocalePath'
import { formatDate, formatEventTime, generateEventSlug } from '@/lib/utils'
import {
  FAQS,
  NETWORKING_FORMATS,
  groupEventsBySeries,
  matchesFormat,
  type BusinessEvent,
  type EventSeriesGroup,
} from '@/lib/businessEventsWien'
import { MapPin } from 'lucide-react'

/*
 * Diese Ansicht rendert NICHT mehr selbst JSON-LD.
 *
 * Bis zuletzt hingen hier zwei injectJsonLd-Aufrufe in einem useEffect sowie
 * eine Manipulation von <meta description> und <link rel=canonical> im DOM.
 * Beides lief erst im Client — im initialen HTML stand davon nichts, und genau
 * das lesen die meisten Crawler. Metadaten liegen jetzt in der page.tsx, die
 * strukturierten Daten ebenfalls (components/seo/JsonLd.tsx).
 */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  )
}

/**
 * Eine Karte je Serie.
 *
 * Gezeigt wird der nächste Termin. Weitere Termine derselben Serie hängen
 * darunter als aufklappbare Liste — bewusst inline und nicht als Dialog: Der
 * Nutzer vergleicht Termine, dabei soll die Karte sichtbar bleiben.
 */
function SeriesCard({
  group,
  isEnglish,
  localePath,
}: {
  group: EventSeriesGroup
  isEnglish: boolean
  localePath: (path: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const furtherDates = group.occurrences.slice(1)

  return (
    <div className="flex flex-col">
      <EventCard event={group.primary as never} />

      {furtherDates.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded(o => !o)}
            aria-expanded={expanded}
            className="text-sm font-medium text-primary hover:underline"
          >
            {expanded
              ? isEnglish
                ? 'Hide further dates'
                : 'Weitere Termine ausblenden'
              : isEnglish
                ? `+${furtherDates.length} more dates`
                : `+${furtherDates.length} weitere Termine`}
          </button>

          {expanded && (
            <ul className="mt-2 space-y-1 border-l pl-3">
              {furtherDates.map((occurrence: BusinessEvent) => {
                const id = occurrence._id || occurrence.id || ''
                const slug = occurrence.name ? generateEventSlug(occurrence.name, id) : id
                const start = occurrence.eventStartTime || occurrence.eventDate

                return (
                  <li key={id} className="text-sm">
                    <Link
                      href={localePath(`/event/${slug}`)}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      {start ? formatDate(start) : ''}
                      {occurrence.eventStartTime ? ` · ${formatEventTime(occurrence.eventStartTime)}` : ''}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function BusinessEventsWien() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const locale = isEnglish ? 'en' : 'de'
  const localePath = useLocalePath()

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'business-events-wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
      category: 'Business',
    }, true),
  })

  /*
   * Wiederkehrende Termine zu je einer Gruppe zusammenfassen. Vorher erzeugte
   * jede Wiederholung eine eigene Karte — 17 Einträge für faktisch drei
   * Veranstaltungen. Der Zähler in der Überschrift zählt jetzt Gruppen.
   */
  const groups = useMemo(() => groupEventsBySeries(events as BusinessEvent[]), [events])

  /*
   * Nur Formate rendern, zu denen es auch Events gibt. Ein leerer Abschnitt
   * „Speed Networking" wäre eine Versprechung ohne Deckung.
   */
  const formatSections = useMemo(
    () =>
      NETWORKING_FORMATS.map(format => ({
        format,
        groups: groups.filter(group => matchesFormat(group.primary, format)),
      })).filter(section => section.groups.length > 0),
    [groups],
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Österreich · Wien</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">
          {isEnglish
            ? 'Business & Networking Events in Vienna'
            : 'Business- & Networking-Events in Wien'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isEnglish
            ? 'Networking events in Vienna in one place: business breakfasts, afterwork rounds, speed networking, industry meetups and conferences. We bring together networking gatherings and business events from across the city and keep the dates current. Tickets can be bought directly here.'
            : 'Networking-Events in Wien an einem Ort: Businessfrühstücke, Afterwork-Runden, Speed Networking, Branchen-Meetups und Konferenzen. Wir bündeln Netzwerkveranstaltungen und Business-Events aus der ganzen Stadt und halten die Termine laufend aktuell. Tickets kaufst du direkt hier.'}
        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? 'Current Business Events in Vienna' : 'Aktuelle Business Events in Wien'}{' '}
          {!isLoading && (
            <span className="text-muted-foreground font-normal text-base">
              ({groups.length})
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground">
            {isEnglish ? 'No business events in Vienna found.' : 'Aktuell keine Business Events in Wien gefunden.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {groups.map(group => (
              <SeriesCard
                key={group.primary._id || group.primary.id}
                group={group}
                isEnglish={isEnglish}
                localePath={localePath}
              />
            ))}
          </div>
        )}
      </div>

      {/*
        * Formatübersicht statt Standortprosa.
        *
        * Hier stand ein Block „Business Events in Wien entdecken", der den
        * Wirtschaftsstandort Wien beschrieb — für jemanden, der ein
        * Networking-Event sucht, beantwortet das nichts. Ersetzt durch die
        * Formate, die es auf der Seite tatsächlich zu sehen gibt.
        */}
      {formatSections.length > 0 && (
        <div className="border-t pt-8 mt-8">
          <h2 className="text-xl font-semibold mb-6">
            {isEnglish ? 'Networking formats in Vienna' : 'Networking-Formate in Wien'}
          </h2>

          <div className="space-y-8">
            {formatSections.map(({ format }) => (
              <section key={format.id}>
                <h3 className="text-lg font-semibold mb-2">{format.heading[locale]}</h3>
                <p className="text-muted-foreground text-md">
                  {format.description[locale]}
                </p>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* FAQ — Texte aus lib/businessEventsWien.ts, dieselbe Quelle wie das FAQPage-Schema */}
      <div className="pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">
          {isEnglish ? 'Frequently Asked Questions about Business Events in Vienna' : 'Häufige Fragen zu Business Events in Wien'}
        </h2>
        <div className="space-y-3">
          {FAQS[locale].map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* CTA Block */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? "Are you planning a business event in Vienna?" : "Du planst ein Business Event in Wien?"}
        </h2>
        <div className="text-muted-foreground text-md mb-4">
          {isEnglish
            ? "Create your business event on Share Your Party and reach Vienna’s business community directly—with built-in ticketing and event promotion."
            : "Erstelle dein Business Event auf Share Your Party und erreiche direkt die Wiener Business Community – mit integriertem Ticketing und Event-Promotion."}
        </div>
        <Link
          href={localePath('/veranstalter')}
          className="inline-flex items-center justify-center text-sm font-medium gradient-bg text-white hover:opacity-90 h-10 rounded-md px-6"
        >
          {isEnglish ? "Learn more about Share Your Party" : "Mehr über Share Your Party erfahren"}
        </Link>
      </div>
    </div>
  )
}
