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
    q: 'Wo finde ich aktuelle Club-Events und Partys in Wien?',
    a: 'Auf Share Your Party findest du alle aktuellen Clubbings und Partys in Wien 2026 – von wöchentlichen Club-Nights bis zu besonderen Events am Wochenende. Einfach filtern, entdecken und direkt Tickets kaufen.',
  },
  {
    q: 'Wann ist die beste Zeit zum Clubbing in Wien?',
    a: 'Wiens Clubszene ist das ganze Jahr aktiv. Besonders lebhaft ist sie an Wochenenden sowie rund um Feiertage. Im Sommer verlagert sich das Nightlife an den Donaukanal und in Open-Air-Locations wie die Pratersauna oder den Volksgarten-Außenbereich.',
  },
  {
    q: 'Wie komme ich nachts in Wien von Club zu Club?',
    a: 'Wien bietet eine hervorragende Nachtverbindung: Die Nightline-Busse und die U-Bahn fahren am Wochenende durchgehend. Die meisten Club-Locations liegen zudem in gut erreichbaren Bezirken rund um den Gürtel, den Donaukanal und die Innenstadt.',
  },
  {
    q: 'Kann ich Tickets für Clubbings in Wien direkt kaufen?',
    a: 'Ja – über Share Your Party kaufst du Tickets für Club-Events in Wien direkt beim Veranstalter, ohne Umwege und ohne versteckte Gebühren. Dein Ticket ist per QR Code in der App verfügbar und ist direkt am Eingang gültig. ',
  },
  {
    q: 'Wie kann ich mein Clubbing in Wien auf Share Your Party eintragen?',
    a: 'Als Veranstalter kannst du dein Club-Event kostenlos auf Share Your Party eintragen und direkt Tickets verkaufen. Die Registrierung dauert nur wenige Minuten – danach erreichst du tausende Clubbing-Fans in Wien. ',
  },
  {
    q: 'Warum sollte ich mein Clubbing auf Share Your Party anbieten?',
    a: 'Share Your Party ist mehr als eine klassische Eventplattform. Besucher können Events mit Vibes bewerten, Erinnerungen im Memories-Feature festhalten und ihre Erlebnisse teilen – so entsteht echtes Engagement rund um deine Veranstaltung. Für mehr Sichtbarkeit stehen Spotlight-Platzierungen direkt in der App und auf der Website zur Verfügung. ',
  },
]

const faqsEn = [
  {
    q: 'Where can I find the latest club events and parties in Vienna?',
    a: 'On Share Your Party, you’ll find all the latest club nights and parties in Vienna for 2026—from weekly club nights to special weekend events. Just filter, explore, and buy tickets directly.',
  },
  {
    q: 'When is the best time to go clubbing in Vienna?',
    a: 'Vienna’s club scene is active all year round. It’s especially lively on weekends and around holidays. In the summer, the nightlife shifts to the Danube Canal and open-air venues like the Pratersauna or the Volksgarten outdoor area.',
  },
  {
    q: 'How do I get from club to club at night in Vienna?',
    a: 'Vienna offers excellent nighttime transportation: Nightline buses and the subway run nonstop on weekends. Most club locations are also in easily accessible districts around the Gürtel, the Danube Canal, and the city center. ',
  },
  {
    q: 'Can I buy tickets for club events in Vienna directly?',
    a: 'Yes—through Share Your Party, you can buy tickets for club events in Vienna directly from the organizer, with no middlemen and no hidden fees. Your ticket will be available via QR Code in the app and is valid right at the entrance.',
  },
  {
    q: 'How can I list my club event in Vienna on Share Your Party?',
    a: 'As an organizer, you can list your club event on Share Your Party for free and sell tickets directly. Registration takes just a few minutes—after that, you’ll reach thousands of clubbing fans in Vienna. ',
  },
  {
    q: 'Why should I list my club event on Share Your Party?',
    a: 'Share Your Party is more than just a traditional event platform. Visitors can rate events based on their vibe, capture memories using the Memories feature, and share their experiences—creating genuine engagement around your event. For greater visibility, Spotlight placements are available directly in the app and on the website.',
  },
]

export default function KonzerteWien() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'konzerte-wien'],
    queryFn: () => eventsService.getPublicEvents({
      latitude: '48.2092',
      longitude: '16.3728',
      radius: 30,
      category: 'Clubbing',
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
      ? 'Discover the best clubs and parties in Vienna in 2026 – all club events at a glance ► Buy tickets directly on Share Your Party!'
      : 'Entdecke die besten Clubbings und Partys in Wien 2026 – alle Club-Events auf einen Blick ► Tickets direkt kaufen auf Share Your Party!',
    )

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', isEnglish
      ? 'https://shareyourparty.de/en/events/clubbings-wien'
      : 'https://shareyourparty.de/events/clubbings-wien',
    )

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [isEnglish])

  useEffect(() => {
    if (!events.length) return

    injectJsonLd('schema-clubbings-wien', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Clubbings in Wien',
      url: 'https://shareyourparty.de/events/clubbings-wien',
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

    injectJsonLd('schema-clubbings-wien-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Wo finde ich aktuelle Club-Events und Partys in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Auf Share Your Party findest du alle aktuellen Clubbings und Partys in Wien 2026 – von wöchentlichen Club-Nights bis zu besonderen Events am Wochenende. Einfach filtern, entdecken und direkt Tickets kaufen.' } },
        { '@type': 'Question', name: 'Wann ist die beste Zeit zum Clubbing in Wien?', acceptedAnswer: { '@type': 'Answer', text: 'Wiens Clubszene ist das ganze Jahr aktiv. Besonders lebhaft ist sie an Wochenenden sowie rund um Feiertage. Im Sommer verlagert sich das Nightlife an den Donaukanal und in Open-Air-Locations wie die Pratersauna oder den Volksgarten-Außenbereich.' } },
        { '@type': 'Question', name: 'Wie komme ich nachts in Wien von Club zu Club?', acceptedAnswer: { '@type': 'Answer', text: 'Wien bietet eine hervorragende Nachtverbindung: Die Nightline-Busse und die U-Bahn fahren am Wochenende durchgehend. Die meisten Club-Locations liegen zudem in gut erreichbaren Bezirken rund um den Gürtel, den Donaukanal und die Innenstadt.' } },
        { '@type': 'Question', name: 'Kann ich Tickets für Clubbings in Wien direkt kaufen?', acceptedAnswer: { '@type': 'Answer', text: 'Ja – über Share Your Party kaufst du Tickets für Club-Events in Wien direkt beim Veranstalter, ohne Umwege und ohne versteckte Gebühren. Dein Ticket kommt per E-Mail und ist direkt am Eingang gültig. ' } },
        { '@type': 'Question', name: 'Wie kann ich mein Clubbing in Wien auf Share Your Party eintragen?', acceptedAnswer: { '@type': 'Answer', text: 'Als Veranstalter kannst du dein Club-Event kostenlos auf Share Your Party eintragen und direkt Tickets verkaufen. Die Registrierung dauert nur wenige Minuten – danach erreichst du tausende Clubbing-Fans in Wien.' } },
        { '@type': 'Question', name: 'Warum sollte ich mein Clubbing auf Share Your Party anbieten?', acceptedAnswer: { '@type': 'Answer', text: 'Share Your Party ist mehr als eine klassische Eventplattform. Besucher können Events mit Vibes bewerten, Erinnerungen im Memories-Feature festhalten und ihre Erlebnisse teilen – so entsteht echtes Engagement rund um deine Veranstaltung. Für mehr Sichtbarkeit stehen Spotlight-Platzierungen direkt in der App und auf der Website zur Verfügung.' } },
      ],
    })

    return () => { removeJsonLd('schema-clubbings-wien'); removeJsonLd('schema-clubbings-wien-faq') }
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
          {isEnglish ? 'Clubbings in Vienna' : 'Clubbings in Wien'}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          {isEnglish
            ? 'Vienna is one of Europe’s most exciting clubbing destinations. Whether it’s techno nights along the Danube, hip-hop parties in the city’s districts, or legendary club nights at famous venues—Vienna’s nightlife has something for everyone.  You can see all club events and parties in Vienna in 2026 at a glance on Share Your Party—and buy your tickets directly from the organizer.'
            : 'Wien ist eine der aufregendsten Clubbing-Metropolen Europas. Ob es sich um Techno-Nächte an der Donau, Hip-Hop-Partys in den Bezirken oder legendäre Clubbings in berühmten Locations handelt – das Nachtleben in Wien hat für jeden etwas zu bieten.  Alle Club-Events und Partys in Wien 2026 siehst du auf Share Your Party auf einen Blick – und kannst deine Tickets direkt beim Veranstalter kaufen.'}
        </p>
      </div>

      {/* Redaktioneller Textblock */}
      <div className="bg-muted/40 rounded-xl p-6 mb-10 prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mb-3">
          {isEnglish ? 'The Vienna clubbing scene' : 'Die Wiener Clubbing-Szene'}
        </h2>
        <p className="text-muted-foreground mb-3">
          {isEnglish
            ? 'Vienna’s club scene is just as colorful and diverse as the city itself. While electronic music and techno dominate many of the city’s most famous clubs, smaller underground venues are also hosting queer nights, ’80s and ’90s parties, hip-hop events, and alternative club nights. Whether on the Gürtel, along the Danube Canal, or in the city center—there’s always a party to suit your taste in Vienna. Share Your Party connects partygoers and organizers directly: no hidden costs and no need to go through third-party providers.'
            : 'Die Clubszene in Wien ist ebenso bunt und vielfältig wie die Stadt insgesamt. In vielen der bekanntesten Clubs herrschen elektronische Musik und Techno vor, doch daneben entwickeln sich in kleinen Underground-Locations Queer Nights, 80er- und 90er-Partys, Hip-Hop-Events sowie alternative Clubbings. Ob am Gürtel, am Donaukanal oder in der City – in Wien gibt es immer eine passende Party. Share Your Party bringt Feierwillige und Veranstalter direkt zusammen: keine versteckten Kosten und keinen Umweg über Drittanbieter.'}
        </p>
      </div>

      {/* Event Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEnglish ? 'Current Club Events in Vienna' : 'Aktuelle Club-Events in Wien'}{' '}
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
            {isEnglish ? 'No club events in Vienna found.' : 'Aktuell keine Club-Events in Wien gefunden.'}
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
          {isEnglish ? 'Club Locations in Vienna' : 'Club-Locations in Wien'}
        </h2>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'There are many great venues in Vienna where club events take place. Some of the most famous are:'
            : 'Es gibt viele tolle Locations in Wien, in denen Club-Events stattfinden. Einige der bekanntesten sind:'}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">U4</h3>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'The U4 in the 12th district is one of Austria’s legendary club destinations—since the 1970s, it has been the venue for concerts and parties spanning all genres. Whether it’s rock, alternative, electronic, or themed parties: The U4 is a symbol of diversity and Viennese club culture in its purest form. Thanks to its intimate atmosphere and loyal regulars, every evening becomes something special.'
            : 'Der U4 im 12. Bezirk ist eine der legendären Club-Adressen Österreichs – seit den 1970ern ist er der Schauplatz für Konzerte und Partys über alle Genres hinweg. Ob Rock, Alternative, Electronic oder Themenpartys: Das U4 ist ein Symbol für Vielfalt und die Wiener Clubkultur in ihrer reinsten Form. Dank der intimen Atmosphäre und des loyalen Stammpublikums wird jeder Abend zu etwas Besonderem.'} <br></br><br></br><a href="/user/69ef650917c15ccc7b72ffa8/events"><button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-bg text-white hover:opacity-90 h-9 rounded-md px-3">{isEnglish ? 'Discover U4 Events!' : 'Events des U4 entdecken!'}</button><br></br></a>
          <br></br>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Volksgarten</h3>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'Located right on the Ringstrasse with a view of the Burgtheater, the Volksgarten is one of the most beautiful club venues in Vienna. In the summer, the outdoor area is known for electronic music and special club nights; it transforms into one of the city’s most beautiful open-air spots. A Viennese classic that has continued to enchant visitors for decades.'
            : 'Unmittelbar am Ring und mit einer Aussicht auf das Burgtheater gelegen, ist der Volksgarten einer der schönsten Clubstandorte in Wien. Der Außenbereich ist im Sommer bekannt für elektronische Musik und besondere Clubbing-Nights; er verwandelt sich in einen der schönsten Open-Air-Spots der Stadt. Ein Klassiker aus Wien, der seit Jahrzehnten immer noch bezaubert.'} <br></br><br></br><a href="/user/69f273ec345cc2e363456388/events"><button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gradient-bg text-white hover:opacity-90 h-9 rounded-md px-3">{isEnglish ? 'Discover Volksgarten Events!' : 'Events des Volksgarten entdecken!'}</button><br></br></a>
          <br></br>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Grelle Forelle</h3>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? "Grelle Forelle on the Danube Canal is one of Vienna’s most prestigious techno clubs and enjoys a reputation that extends far beyond the city limits. It is a fixture on the European club scene, thanks to its curated lineup and its prime waterfront location."
            : 'Die Grelle Forelle am Donaukanal ist einer der angesehensten Techno-Clubs in Wien und genießt einen Ruf, der über die Stadtgrenzen hinausreicht. Sie ist eine feste Größe in der europäischen Club-Szene, dank eines kuratierten Booking-Programms und ihrer direkten Lage am Wasser.'}<br></br>
          <br></br>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Flex</h3>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'The Flex, located under the Reichsbrücke bridge on the Danube Canal, has been a fixture since the 1990s. It’s raw, authentic, and offers a lineup that ranges from electronic to punk to indie. No other club embodies the Viennese underground spirit quite like the Flex.'
            : 'Das Flex unter der Reichsbrücke am Donaukanal ist seit den 90ern eine Institution. Es ist roh, authentisch und bietet ein Programm, das von Electronic über Punk bis zu Indie reicht. Kein anderer Club verkörpert den Wiener Underground-Spirit so sehr wie das Flex.'}<br></br>
          <br></br>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">Pratersauna</h3>
        <div className="text-muted-foreground text-md">
          {isEnglish
            ? 'The Pratersauna in the 2nd district combines a club, an open-air pool, and an outdoor dining area into a unique experience. In the summer, it’s one of the city’s most popular spots for open-air electronic music.'
            : 'Die Pratersauna im 2. Bezirk kombiniert Club, Open-Air-Pool und Gastgarten zu einem einzigartigen Erlebnis. Im Sommer ist sie einer der beliebtesten Orte der Stadt für elektronische Musik unter freiem Himmel.'}
        </div>
      </div>
      {/* FAQ */}
      <div className="pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-6">
          {isEnglish ? 'Frequently Asked Questions about Clubbing in Vienna' : 'Häufige Fragen zum Clubbing in Wien'}
        </h2>
        <div className="space-y-3">
          {(isEnglish ? faqsEn : faqsDe).map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </div>
  )
}
