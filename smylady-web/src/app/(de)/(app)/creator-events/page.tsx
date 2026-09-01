import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorEventsPage from '@/views/CreatorEventsPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/creator-events'
  return {
    title: 'Creator-Marketing für Unternehmen — Share Your Party',
    // "Influencer-Marketing" bleibt hier bewusst stehen: Das ist der eingeführte
    // Suchbegriff, nach dem Unternehmen suchen. Die Marke heißt Creator Club, der
    // Suchbegriff bleibt davon unberührt.
    description: 'Finde passende Creators für deine Marke und starte deine nächste Influencer-Marketing-Kampagne mit Share Your Party.',
    alternates: localeAlternates('/creator-events', 'de'),
    openGraph: {
      title: 'Creator-Marketing für Unternehmen — Share Your Party',
      description: 'Wir verbinden deine Marke mit Creators, die deine Zielgruppe wirklich erreichen.',
      url,
      type: 'website',
    },
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Creator-Marketing für Unternehmen',
  description:
    'Wir verbinden deine Marke mit Creators, die deine Zielgruppe wirklich erreichen — von Experience Marketing bis Social Media Content.',
  provider: {
    '@type': 'Organization',
    name: 'Share Your Party',
    url: 'https://shareyourparty.de',
    areaServed: {
      '@type': 'City',
      name: 'Wien',
    },
  },
  areaServed: {
    '@type': 'City',
    name: 'Wien',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Creator Marketing Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Experience Marketing',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Social Media Content',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Creator Events',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Produkt- & Location-Reviews',
        },
      },
    ],
  },
}

export default function CreatorEventsRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CreatorEventsPage />
    </>
  )
}
