'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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

const faqsDe = [
  {
    q: 'Was sind Business Events in Wien?',
    a: 'Business Events in Wien umfassen Networking-Veranstaltungen, Konferenzen, Workshops, Seminare und Meetups für Unternehmer, Führungskräfte und Professionals. Sie bieten die Möglichkeit, neue Kontakte zu knüpfen, Wissen zu erweitern und sich in der Wiener Business-Community zu vernetzen.',
  },
  {
    q: 'Wo finden Business Events in Wien statt?',
    a: 'Business Events in Wien finden an verschiedenen Locations statt – von Coworking Spaces und Hotels bis hin zu Konferenzzentren und Restaurants. Wien gilt als einer der führenden Business-Standorte Europas und bietet eine breite Auswahl an Veranstaltungsorten.',
  },
  {
    q: 'Gibt es kostenlose Business Events in Wien?',
    a: 'Ja, auf Share Your Party findest du sowohl kostenlose als auch kostenpflichtige Business Events in Wien. Viele Networking-Events und Meetups sind kostenlos zugänglich.',
  },
  {
    q: 'Wie finde ich Business Networking Events in Wien?',
    a: 'Auf Share Your Party kannst du gezielt nach Business Events in Wien suchen und filtern. Erstelle ein kostenloses Konto um keine Veranstaltung zu verpassen und Tickets direkt zu kaufen.',
  },
  {
    q: 'Wie kann ich ein Business Event in Wien auf Share Your Party erstellen?',
    a: 'Du kannst dein Business Event auf Share Your Party anlegen. Registriere dich auf shareyourparty.de, erstelle dein Event mit allen Details und erreiche direkt die Business Community in Wien.',
  },
]

const faqsEn = [
  {
    q: 'What are business events in Vienna?',
    a: 'Business events in Vienna include networking events, conferences, workshops, seminars, and meetups for entrepreneurs, executives, and professionals. They offer the opportunity to make new connections, expand your knowledge, and network within Vienna’s business community.',
  },
  {
    q: 'Where do business events in Vienna take place?',
    a: 'Business events in Vienna take place at various locations—from coworking spaces and hotels to conference centers and restaurants. Vienna is considered one of Europe’s leading business hubs and offers a wide selection of venues.',
  },
  {
    q: 'Are there free business events in Vienna?',
    a: 'Yes, on Share Your Party you’ll find both free and paid business events in Vienna. Many networking events and meetups are free to attend.',
  },
  {
    q: 'How do I find business networking events in Vienna?',
    a: 'On Share Your Party, you can search for and filter business events in Vienna. Create a free account so you don’t miss any events and can buy tickets directly.',
  },
  {
    q: 'How can I create a business event in Vienna on Share Your Party?',
    a: 'You can create your business event on Share Your Party. Register at shareyourparty.de, create your event with all the details, and reach the business community in Vienna directly.',
  },
]

export default function BusinessEventsWien() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'business-events-wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
      category: 'Business',
    }, true),
  })

  useEffect(() => {
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', isEnglish
      ? 'All business events in Vienna 2026 at a glance – buy tickets directly, discover events and share experiences ► Now on Share Your Party!'
      : 'Alle Business-Events in Wien 2026 auf einen Blick – Tickets direkt kaufen, Events entdecken und Erlebnisse teilen ► Jetzt auf Share Your Party!',
    )

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', isEnglish
      ? 'https://shareyourparty.de/en/events/business-events-wien'
      : 'https://shareyourparty.de/events/business-events-wien',
    )

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [isEnglish])

  useEffect(() => {
    if (!events.length) return

    injectJsonLd('schema-business-events-wien', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Business Events in Wien',
      url: 'https://shareyourparty.de/events/business-events-wien',
      itemListElement: events.slice(0, 10).map((event: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BusinessEvent',
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

    injectJsonLd('schema-business-events-wien-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Was sind Business Events in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Business Events in Wien umfassen Networking-Veranstaltungen, Konferenzen, Workshops, Seminare und Meetups für Unternehmer, Führungskräfte und Professionals. Sie bieten die Möglichkeit, neue Kontakte zu knüpfen, Wissen zu erweitern und sich in der Wiener Business-Community zu vernetzen.' } },
        { '@type': 'Question', name: 'Wo finden Business Events in Wien statt?', acceptedAnswer: { '@type': 'Answer', text: 'Business Events in Wien finden an verschiedenen Locations statt – von Coworking Spaces und Hotels bis hin zu Konferenzzentren und Restaurants. Wien gilt als einer der führenden Business-Standorte Europas und bietet eine breite Auswahl an Veranstaltungsorten.' } },
        { '@type': 'Question', name: 'Gibt es kostenlose Business Events in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Ja, auf Share Your Party findest du sowohl kostenlose als auch kostenpflichtige Business Events in Wien. Viele Networking-Events und Meetups sind kostenlos zugänglich.' } },
        { '@type': 'Question', name: 'Wie finde ich Business Networking Events in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Auf Share Your Party kannst du gezielt nach Business Events in Wien suchen und filtern. Erstelle ein kostenloses Konto um keine Veranstaltung zu verpassen und Tickets direkt zu kaufen.' } },
        { '@type': 'Question', name: 'Wie kann ich ein Business Event in Wien auf Share Your Party erstellen?', acceptedAnswer: { '@type': 'Answer', text: 'Du kannst dein Business Event auf Share Your Party anlegen. Registriere dich auf shareyourparty.de, erstelle dein Event mit allen Details und erreiche direkt die Business Community in Wien.' } },

      ],
    })

    return () => { removeJsonLd('schema-business-events-wien'); removeJsonLd('schema-business-events-wien-faq') }
  }, [events])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Österreich · Wien</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">
          {isEnglish ? 'Business Events in Vienna' : 'Business Events in Wien'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isEnglish
            ? 'Discover networking events, conferences, workshops, and seminars in Vienna—and buy tickets directly on Share Your Party. Vienna is one of Europe’s leading business hubs, with an active community of entrepreneurs, startups, and executives.'
            : 'Entdecke Networking-Events, Konferenzen, Workshops und Seminare in Wien – und kaufe Tickets direkt auf Share Your Party. Wien ist einer der führenden Business-Standorte Europas, mit einer aktiven Community aus Unternehmern, Startups und Führungskräften.'}
        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? 'Current Business Events in Vienna' : 'Aktuelle Business Events in Wien'}{' '}
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
            {isEnglish ? 'No business events in Vienna found.' : 'Aktuell keine Business Events in Wien gefunden.'}
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
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? 'Discover Business Events in Vienna' : 'Business Events in Wien entdecken'}
        </h2>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Vienna is one of Europe’s most attractive business locations. The Austrian capital offers a unique combination of international networking opportunities, a high quality of life, and a dynamic startup and business scene. Business events in Vienna reflect this diversity.'
            : 'Wien zählt zu den attraktivsten Business-Standorten Europas. Die österreichische Hauptstadt bietet eine einzigartige Kombination aus internationaler Vernetzung, hoher Lebensqualität und einer dynamischen Startup- und Unternehmensszene. Business Events in Wien spiegeln diese Vielfalt wider.'}
        </div><br></br><br></br>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Whether it’s networking evenings for founders, industry conferences for executives, or hands-on workshops for marketing and tech professionals—the range of business events in Vienna is broad and growing steadily. Share Your Party brings these events together on one platform, making them easy to find.'
            : 'Ob Networking-Abende für Gründer, Fachkonferenzen für Führungskräfte oder praxisnahe Workshops für Marketing- und Tech-Professionals – das Angebot an Business Events in Wien ist breit und wächst stetig. Share Your Party bündelt diese Veranstaltungen auf einer Plattform und macht sie einfach auffindbar.'}
        </div><br></br><br></br>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'With Share Your Party, you can find business events in Vienna with just a few clicks, buy tickets directly, and share events with your network. Organizers can list their business events on Share Your Party and reach the Vienna business community directly.'
            : 'Mit Share Your Party findest du Business Events in Wien mit wenigen Klicks, kaufst Tickets direkt und teilst Events mit deinem Netzwerk. Veranstalter können ihre Business Events auf Share Your Party anlegen und die Wiener Business Community direkt erreichen.'}
        </div>
      </div>
      {/* FAQ */}
      <div className="pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">
          {isEnglish ? 'Frequently Asked Questions about Business Events in Vienna' : 'Häufige Fragen zu Business Events in Wien'}
        </h2>
        <div className="space-y-3">
          {(isEnglish ? faqsEn : faqsDe).map((faq, i) => (
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
        <a href={isEnglish ? "/en/veranstalter" : "/veranstalter"}
          className="inline-flex items-center justify-center text-sm font-medium gradient-bg text-white hover:opacity-90 h-10 rounded-md px-6"
        >
          {isEnglish ? "Learn more about Share Your Party" : "Mehr über Share Your Party erfahren"}
        </a>
      </div>
    </div>
  )
}
