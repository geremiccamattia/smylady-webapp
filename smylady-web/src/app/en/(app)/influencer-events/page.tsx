import type { Metadata } from 'next'
import InfluencerEventsPage from '@/views/InfluencerEventsPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/en/influencer-events'
  return {
    title: 'Influencer Marketing for Businesses — Share Your Party',
    description: 'Find the right creators for your brand and start your next influencer marketing campaign with Share Your Party.',
    alternates: {
      canonical: url,
      languages: { de: 'https://shareyourparty.de/influencer-events' },
    },
    openGraph: {
      title: 'Influencer Marketing for Businesses — Share Your Party',
      description: 'We connect your brand with creators who truly reach your target audience.',
      url,
      type: 'website',
    },
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Influencer Marketing for Businesses',
  description:
    'We connect your brand with creators who truly reach your target audience — from experience marketing to social media content.',
  provider: {
    '@type': 'Organization',
    name: 'Share Your Party',
    url: 'https://shareyourparty.de',
    areaServed: {
      '@type': 'City',
      name: 'Vienna',
    },
  },
  areaServed: {
    '@type': 'City',
    name: 'Vienna',
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
          name: 'Product & Location Reviews',
        },
      },
    ],
  },
}

export default function InfluencerEventsRouteEN() {
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
