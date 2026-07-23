import type { Metadata } from 'next'
import InfluencerEventsPage from '@/views/InfluencerEventsPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/influencer-events'
  return {
    title: 'Influencer Marketing für Unternehmen — Share Your Party',
    description: 'Finde passende Creator für deine Marke und starte deine nächste Influencer-Marketing-Kampagne mit Share Your Party.',
    alternates: {
      canonical: url,
      languages: { en: 'https://shareyourparty.de/en/influencer-events' },
    },
    openGraph: {
      title: 'Influencer Marketing für Unternehmen — Share Your Party',
      description: 'Wir verbinden deine Marke mit Creatorn, die deine Zielgruppe wirklich erreichen.',
      url,
      type: 'website',
    },
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Influencer Marketing für Unternehmen',
  description:
    'Wir verbinden deine Marke mit Creatorn, die deine Zielgruppe wirklich erreichen — von Experience Marketing bis Social Media Content.',
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
    name: 'Influencer Marketing Services',
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
          name: 'Influencer Events',
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

export default function InfluencerEventsRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InfluencerEventsPage />
    </>
  )
}
