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
    q: 'Was sind Workshops in Wien?',
    a: 'Workshops in Wien sind strukturierte Veranstaltungen bei denen Teilnehmer in kleinen Gruppen praktische Fähigkeiten erlernen oder vertiefen. Das Angebot reicht von kreativen Kursen über Business-Seminare bis hin zu Wellness- und Mental-Health-Workshops.',
  },
  {
    q: 'Welche Arten von Workshops gibt es in Wien?',
    a: ' In Wien gibt es eine große Vielfalt – Kreativ-Workshops wie Töpfern, Malen und DIY-Kurse, Kochworkshops, Business-Seminare, Fotokurse, Tanzworkshops, Wellness- und Mental-Health-Workshops sowie viele weitere Formate für unterschiedliche Interessen.',
  },
  {
    q: 'Wie viel kostet ein Workshop in Wien?',
    a: 'Die Kosten variieren je nach Art und Dauer des Workshops. Auf Share Your Party findest du sowohl kostenlose Workshops als auch kostenpflichtige Angebote.',
  },
  {
    q: 'Wo finden Workshops in Wien statt?',
    a: 'Workshops in Wien finden an verschiedenen Locations statt – in Ateliers, Studios, Coworking Spaces, Cafés, Kulturzentren und anderen Veranstaltungsorten in der ganzen Stadt.',
  },
  {
    q: 'Wie kann ich einen Workshop in Wien auf Share Your Party einstellen?',
    a: 'Du kannst deinen Workshop auf Share Your Party anlegen. Registriere dich auf shareyourparty.de, erstelle dein Event mit allen Details und erreiche direkt Interessierte in Wien.',
  },
]

const faqsEn = [
  {
    q: 'What are workshops in Vienna?',
    a: 'Workshops in Vienna are structured events where participants learn or refine practical skills in small groups. The offerings range from creative courses and business seminars to wellness and mental health workshops.',
  },
  {
    q: 'What kinds of workshops are available in Vienna?',
    a: 'Vienna offers a wide variety of options—creative workshops such as pottery, painting, and DIY classes, cooking workshops, business seminars, photography classes, dance workshops, wellness and mental health workshops, and many other formats catering to a range of interests.',
  },
  {
    q: 'How much do workshops in Vienna cost?',
    a: 'The cost varies depending on the type and duration of the workshop. On Share Your Party, youll find both free workshops and paid options.',
  },
  {
    q: 'Where do workshops in Vienna take place?',
    a: 'Workshops in Vienna are held at various locations—in art studios, studios, coworking spaces, cafés, cultural centers, and other venues throughout the city.',
  },
  {
    q: 'How can I list a workshop in Vienna on Share Your Party?',
    a: 'You can create your workshop on Share Your Party. Sign up at shareyourparty.de, create your event with all the details, and reach people in Vienna who are interested.',
  },
]

export default function WorkshopsWien() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'workshops-wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
      category: 'Workshop',
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
      ? 'All workshops in Vienna 2026 at a glance – buy tickets directly, discover events and share experiences ► Now on Share Your Party!'
      : 'Alle Workshop-Events in Wien 2026 auf einen Blick – Tickets direkt kaufen, Events entdecken und Erlebnisse teilen ► Jetzt auf Share Your Party!',
    )

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', isEnglish
      ? 'https://shareyourparty.de/en/events/workshops-wien'
      : 'https://shareyourparty.de/events/workshops-wien',
    )

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [isEnglish])

  useEffect(() => {
    if (!events.length) return

    injectJsonLd('schema-workshops-wien', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Workshops in Wien',
      url: 'https://shareyourparty.de/events/workshops-wien',
      itemListElement: events.slice(0, 10).map((event: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'WorkshopEvent',
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

    injectJsonLd('schema-workshops-wien-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Was sind Workshops in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Workshops in Wien umfassen Bildungs- und Entwicklungsveranstaltungen, die sich auf spezifische Themen konzentrieren. Sie bieten die Möglichkeit, neue Fähigkeiten zu erlernen, Wissen zu erweitern und sich in der Wiener Workshop-Community zu vernetzen.' } },
        { '@type': 'Question', name: 'Wo finden Workshops in Wien statt?', acceptedAnswer: { '@type': 'Answer', text: 'Workshops in Wien finden an verschiedenen Locations statt – von Coworking Spaces und Bildungseinrichtungen bis hin zu Konferenzzentren und Restaurants. Wien gilt als einer der führenden Standorte für Bildung und Entwicklung in Europa und bietet eine breite Auswahl an Veranstaltungsorten.' } },
        { '@type': 'Question', name: 'Gibt es kostenlose Workshops in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Ja, auf Share Your Party findest du sowohl kostenlose als auch kostenpflichtige Workshops in Wien. Viele Bildungsveranstaltungen sind kostenlos zugänglich.' } },
        { '@type': 'Question', name: 'Wie finde ich Networking-Workshops in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Auf Share Your Party kannst du gezielt nach Workshops in Wien suchen und filtern. Erstelle ein kostenloses Konto um keine Veranstaltung zu verpassen und Tickets direkt zu kaufen.' } },
        { '@type': 'Question', name: 'Wie kann ich einen Workshop in Wien auf Share Your Party erstellen?', acceptedAnswer: { '@type': 'Answer', text: 'Du kannst deinen Workshop auf Share Your Party anlegen. Registriere dich auf shareyourparty.de, erstelle dein Event mit allen Details und erreiche direkt die Workshop Community in Wien.' } },

      ],
    })

    return () => { removeJsonLd('schema-workshops-wien'); removeJsonLd('schema-workshops-wien-faq') }
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
          {isEnglish ? 'Workshops in Vienna' : 'Workshops in Wien'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isEnglish
            ? 'Discover workshops in Vienna—from creative workshops and cooking classes to business seminars, wellness workshops, and mental health workshops. On Share Your Party, you can see all the workshops in Vienna at a glance and book them directly through the platform.'
            : 'Entdecke Workshops in Wien – von Kreativ-Workshops und Kochkursen über Business-Seminare bis hin zu Wellness- und Mental-Health-Workshops. Auf Share Your Party findest du alle Workshops in Wien auf einen Blick und buchst direkt über die Plattform.'}
        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? 'Current Workshops in Vienna' : 'Aktuelle Workshops in Wien'}{' '}
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
            {isEnglish ? 'No workshops in Vienna found.' : 'Aktuell keine Workshops in Wien gefunden.'}
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
          {isEnglish ? 'Discover Workshops in Vienna' : 'Workshops in Wien entdecken'}
        </h2>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Vienna offers a unique variety of workshops to suit every taste and interest. Whether you want to get creative, learn new professional skills, or simply try something new—you’ll find the perfect workshop in Vienna.'
            : 'Wien bietet eine einzigartige Vielfalt an Workshops für jeden Geschmack und jedes Interesse. Ob du kreativ tätig werden, neue berufliche Skills erlernen oder einfach etwas Neues ausprobieren möchtest – in Wien findest du den passenden Workshop.'}
        </div><br></br><br></br>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Creative workshops such as pottery, painting, and DIY classes are particularly popular, but business workshops on topics like marketing, digitalization, and leadership also have a strong following in Vienna. Wellness and mental health workshops are also growing in popularity, as they help people find balance in their stressful daily lives and improve their overall well-being.'
            : 'Besonders beliebt sind Kreativ-Workshops wie Töpfern, Malen oder DIY-Kurse, aber auch Business-Workshops zu Themen wie Marketing, Digitalisierung und Leadership haben in Wien eine starke Community. Immer gefragter werden zudem Wellness- und Mental-Health-Workshops, die dabei helfen, im stressigen Alltag Ausgleich zu finden und die eigene Gesundheit zu stärken.'}
        </div><br></br><br></br>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Share Your Party brings together all kinds of workshops on a single platform. You can find upcoming events, buy tickets directly, and share interesting workshops with friends or colleagues. Event organizers can list their workshops on Share Your Party and reach the Vienna community directly.'
            : 'Share Your Party bündelt Workshops aller Art auf einer Plattform. Du findest aktuelle Termine, kaufst Tickets direkt und teilst interessante Workshops mit Freunden oder Kollegen. Veranstalter können ihre Workshops auf Share Your Party einstellen und direkt die Wiener Community erreichen.'}
        </div><br></br>
      </div>
      {/* FAQ */}
      <div className="pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">
          {isEnglish ? 'Frequently Asked Questions about Workshops in Vienna' : 'Häufige Fragen zu Workshops in Wien'}
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
          {isEnglish ? "Are you organizing a workshop in Vienna?" : "Du bietest Workshops in Wien an?"}
        </h2>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? "Create your workshop on Share Your Party and reach the Vienna community directly—with built-in ticketing and event promotion."
            : "Erstelle deinen Workshop auf Share Your Party und erreiche direkt die Wiener Community – mit integriertem Ticketing und Event-Promotion."}
        </div>
        <a href={isEnglish ? '/en/veranstalter' : '/veranstalter'}
          className="inline-flex items-center justify-center text-sm font-medium gradient-bg text-white hover:opacity-90 h-10 rounded-md px-6 mt-4"
        >
          {isEnglish ? 'Learn more about Share Your Party' : 'Mehr über Share Your Party erfahren'}
        </a>
      </div>
    </div>
  )
}
