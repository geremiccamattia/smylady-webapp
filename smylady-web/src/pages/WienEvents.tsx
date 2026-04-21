import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import { injectJsonLd, removeJsonLd } from '@/lib/utils'
import { MapPin } from 'lucide-react'

export default function WienEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
    }, true),
  })

  useEffect(() => {
    document.title = 'Events in Wien – Partys & Veranstaltungen | Share Your Party'

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      'content',
      'Entdecke die besten Events, Partys und Veranstaltungen in Wien. Kostenlose Tickets, Konzerte, Clubnächte und mehr auf Share Your Party.',
    )

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', 'https://shareyourparty.de/events/wien')

    return () => {
      document.title = 'Share Your Party'
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [])

  useEffect(() => {
    if (!events.length) return

    injectJsonLd('schema-wien-events', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Events in Wien',
      url: 'https://shareyourparty.de/events/wien',
      itemListElement: events.slice(0, 10).map((event: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Event',
          name: event.name,
          startDate: event.eventStartTime || event.eventDate,
          url: `https://shareyourparty.de/event/${event._id}`,
          location: {
            '@type': 'Place',
            name: event.locationName,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Wien',
              addressCountry: 'AT',
            },
          },
        },
      })),
    })

    return () => removeJsonLd('schema-wien-events')
  }, [events])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Österreich · Wien</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Events in Wien</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Wien ist eine der lebendigsten Eventstädte Europas. Ob Clubnächte im Prater,
          Konzerte im Museumsquartier oder spontane Partys in der Leopoldstadt –
          auf Share Your Party findest du alle Events in Wien auf einen Blick.
        </p>
      </div>

      {/* Redaktioneller Textblock */}
      <div className="bg-muted/40 rounded-xl p-6 mb-10 prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mb-3">Die Wiener Eventszene</h2>
        <p className="text-muted-foreground">
          Von der Inneren Stadt bis Floridsdorf – Wien bietet in jedem Bezirk eine
          einzigartige Atmosphäre. Die Wiener Eventkultur reicht von klassischen
          Konzerten und Dinner-Shows bis hin zu Underground-Partys und Open-Air-Events
          am Donaukanal. Share Your Party bringt Veranstalter und Feierwillige
          direkt zusammen – ohne Umwege, ohne versteckte Gebühren.
        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Aktuelle Events{' '}
          {!isLoading && (
            <span className="text-muted-foreground font-normal text-base">
              ({events.length})
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">
            Aktuell keine Events in Wien gefunden.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
