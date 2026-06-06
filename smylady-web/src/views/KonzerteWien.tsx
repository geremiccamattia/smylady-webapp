'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import EventCard from '@/components/events/EventCard'
import { injectJsonLd, removeJsonLd } from '@/lib/utils'
import { MapPin } from 'lucide-react'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
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

export default function KonzerteWien() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'konzerte-wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
      category: 'Music',
    }, true),
  })

  useEffect(() => {
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      'content',
      'Alle Konzerte in Wien 2026 auf einen Blick – Tickets direkt kaufen, Events entdecken und Erlebnisse teilen ► Jetzt auf Share Your Party!',
    )

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', 'https://shareyourparty.de/events/konzerte-wien')

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [])

  useEffect(() => {
    if (!events.length) return

    injectJsonLd('schema-konzerte-wien', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Konzerte in Wien',
      url: 'https://shareyourparty.de/events/konzerte-wien',
      itemListElement: events.slice(0, 10).map((event: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MusicEvent',
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

    injectJsonLd('schema-konzerte-wien-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Wo finde ich aktuelle Konzerte in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Auf Share Your Party findest du aktuelle Konzerte in Wien 2026 – von kleinen Club-Shows bis hin zu großen Arena-Konzerten. Alle Events werden direkt von Veranstaltern eingetragen und sind stets aktuell.' } },
        { '@type': 'Question', name: 'Wie kaufe ich Tickets für Konzerte in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Über Share Your Party kannst du Tickets für Konzerte in Wien direkt beim Veranstalter kaufen – ohne Umwege und ohne versteckte Gebühren. Nach der Buchung erhältst du dein Ticket per E-Mail und kannst es direkt am Eingang vorzeigen. Dabei können in Share Your Party auch Events angelegt werden, die an der Abendkasse zahlbar sind.' } },
        { '@type': 'Question', name: 'Gibt es kostenlose Konzerte in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Ja – Wien bietet regelmäßig kostenlose Open-Air-Konzerte und Gratis-Events, etwa am Donaukanal, im Stadtpark oder bei Stadtfesten. Auf Share Your Party kannst du gezielt nach kostenlosen Konzerten in Wien filtern.' } },
        { '@type': 'Question', name: 'Welche sind die bekanntesten Konzert-Locations in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Zu den bekanntesten Konzert-Venues in Wien zählen die Wiener Stadthalle, die Arena Wien, der Gasometer, das WUK sowie Clubs wie das U4 und der Volksgarten.' } },
        { '@type': 'Question', name: 'Wie kann ich mein Konzert in Wien auf Share Your Party eintragen?', acceptedAnswer: { '@type': 'Answer', text: 'Als Veranstalter kannst du dein Konzert kostenlos auf Share Your Party eintragen und direkt Tickets verkaufen. Die Registrierung dauert wenige Minuten – danach erreichst du tausende Musikfans in Wien.' } },
        { '@type': 'Question', name: 'Warum sollte ich mein Konzert auf Share Your Party anbieten?', acceptedAnswer: { '@type': 'Answer', text: 'Share Your Party bietet neben kostenlosem Event-Eintrag und transparentem Ticketing einzigartige Community-Features: Vibes-Bewertungen, Memories-Feature und Konzerterlebnis-Sharing. Für mehr Sichtbarkeit stehen Spotlight-Platzierungen zur Verfügung.' } },
      ],
    })

    return () => { removeJsonLd('schema-konzerte-wien'); removeJsonLd('schema-konzerte-wien-faq') }
  }, [events])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Österreich · Wien</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Konzerte in Wien</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
Wien ist eine großartige Stadt für Konzerte. Jeden Abend finden in den verschiedenen Locations Konzerte statt. Ob Rock und Pop in der Stadthalle, alternative Acts in der Arena Wien oder Live-Musik im Gasometer - auf Share Your Party findest du alle Konzerte in Wien 2026.        </p>
      </div>

      {/* Redaktioneller Textblock */}
      <div className="bg-muted/40 rounded-xl p-6 mb-10 prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mb-3">Die Wiener Konzertszene</h2>
        <p className="text-muted-foreground mb-3">
Die Wiener Konzertszene ist sehr vielfältig. Von Klassik im Musikverein bis zu Underground-Konzerten im Keller - Wien bietet für jeden Musikgeschmack das passende Live-Erlebnis. Die Stadt hat viele bekannte Konzertsäle und eine lebendige alternative Szene, die in kleinen Clubs und Kulturzentren pulsiert. Share Your Party bringt Konzertveranstalter und Musikfans in Wien direkt zusammen: Tickets kaufen, Events teilen, Abende planen.        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Aktuelle Konzerte in Wien{' '}
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
            Aktuell keine Konzerte in Wien gefunden.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* SEO Footer Text */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-4">Konzert-Locations in Wien</h2>
        <div className="text-muted-foreground text-md">Es gibt viele tolle Locations in Wien, in denen Konzerte stattfinden. Einige der bekanntesten sind:</div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">U4</h3>
        <div className="text-muted-foreground text-md">
          Der legendäre Konzert- und Clubklub im 12. Bezirk ist seit den 1970ern eine feste Institution der Wiener Musikszene. Das U4 steht für ein eklektisches Programm – von Rock und Punk über Electronic bis zu Indie-Nights. Die intime Atmosphäre und die ikonische Bühne machen jeden Konzertabend besonders. <br></br><br></br><a href="/user/69ef650917c15ccc7b72ffa8/events"><button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-bg text-white hover:opacity-90 h-9 rounded-md px-3">Events des U4 entdecken!</button><br></br></a>
          <br></br>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Volksgarten</h3>
        <div className="text-muted-foreground text-md">
          Direkt am Ring, zwischen Burgtheater und Heldenplatz, vereint der Volksgarten Club-Kultur mit Live-Events in einer der stimmungsvollsten Locations Wiens. Bekannt für elektronische Musik, aber auch für besondere Konzertabende und Clubkonzerte. Im Sommer verwandelt sich der Außenbereich in einen der schönsten Open-Air-Spots der Stadt. <br></br><br></br><a href="/user/69f273ec345cc2e363456388/events"><button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-bg text-white hover:opacity-90 h-9 rounded-md px-3">Events des Volksgarten entdecken!</button><br></br></a>
          <br></br>        
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Arena Wien</h3>
        <div className="text-muted-foreground text-md">
         Österreichs größtes alternatives Kulturzentrum im 3. Bezirk bietet auf mehreren Bühnen Platz für ein breites Konzertspektrum – von Independent und Alternative über Metal bis zu Elektronik. Die Arena ist bekannt für ihre besondere Atmosphäre: ein ehemaliges Schlachthof-Areal, das seit den 70ern zur Kulturstätte wurde.<br></br>
          <br></br>
        </div>
         <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Gasometer</h3>
        <div className="text-muted-foreground text-md">
          Die Raiffeisen Halle im Gasometer im 11. Bezirk fasst mehrere tausend Besucher und zieht regelmäßig nationale und internationale Acts an. Ideal für mittelgroße Konzerte mit professioneller Bühnen- und Soundtechnik in einem architektonisch markanten Industriebau.<br></br>
          <br></br>  
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Wiener Stadthalle</h3>
        <div className="text-muted-foreground text-md">
          Mit einer Kapazität von bis zu 16.000 Personen ist die Wiener Stadthalle im 15. Bezirk die größte Konzerthalle Österreichs. Hier gastieren die größten internationalen Acts – von Pop-Superstars bis zu Rock-Legenden.
        </div>
      </div>
      {/* FAQ */}
      <div className="pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">Häufige Fragen zu Konzerten in Wien</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Wo finde ich aktuelle Konzerte in Wien?',
              a: 'Auf Share Your Party findest du aktuelle Konzerte in Wien 2026 – von kleinen Club-Shows bis hin zu großen Arena-Konzerten. Alle Events werden direkt von Veranstaltern eingetragen und sind stets aktuell.',
            },
            {
              q: 'Wie kaufe ich Tickets für Konzerte in Wien?',
              a: 'Über Share Your Party kannst du Tickets für Konzerte in Wien direkt beim Veranstalter kaufen – ohne Umwege und ohne versteckte Gebühren. Nach der Buchung erhältst du dein Ticket per E-Mail und kannst es direkt am Eingang vorzeigen. Dabei können in Share Your Party auch Events angelegt werden, die an der Abendkasse zahlbar sind.',
            },
            {
              q: 'Gibt es kostenlose Konzerte in Wien?',
              a: 'Ja – Wien bietet regelmäßig kostenlose Open-Air-Konzerte und Gratis-Events, etwa am Donaukanal, im Stadtpark oder bei Stadtfesten. Auf Share Your Party kannst du gezielt nach kostenlosen Konzerten in Wien filtern.',
            },
            {
              q: 'Welche sind die bekanntesten Konzert-Locations in Wien?',
              a: 'Zu den bekanntesten Konzert-Venues in Wien zählen die Wiener Stadthalle, die Arena Wien, der Gasometer, das WUK sowie Clubs wie das U4 und der Volksgarten. Share Your Party-Partner wie das U4 und der Volksgarten sind direkt über die Plattform buchbar.',
            },
            {
              q: 'Wie kann ich mein Konzert in Wien auf Share Your Party eintragen?',
              a: 'Als Veranstalter kannst du dein Konzert kostenlos auf Share Your Party eintragen und direkt Tickets verkaufen. Die Registrierung dauert wenige Minuten – danach erreichst du tausende Musikfans in Wien.',
            },
            {
              q: 'Warum sollte ich mein Konzert auf Share Your Party anbieten?',
              a: 'Share Your Party ist mehr als eine klassische Eventplattform. Neben dem kostenlosen Event-Eintrag und transparenten Ticketing-Konditionen bietet Share Your Party einzigartige Community-Features: Besucher können Events mit Vibes bewerten, Erinnerungen im Memories-Feature festhalten und ihre Konzerterlebnisse teilen. So entsteht rund um dein Konzert echtes Engagement – vor, während und nach dem Event. Für mehr Sichtbarkeit stehen zusätzlich Spotlight-Platzierungen direkt in der App und auf der Website zur Verfügung.',
            },
          ].map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </div>
    </div>
  )
}
