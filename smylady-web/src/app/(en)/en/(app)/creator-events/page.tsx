import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorEventsPage from '@/views/CreatorEventsPage'
import { fetchCaseStudiesSafe } from '@/services/cases'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/en/creator-events'
  return {
    title: 'Creator Marketing for Businesses — Share Your Party',
    // "influencer marketing" stays on purpose: it is the established search term
    // businesses look for. The brand is Creator Club, the search term is not.
    description: 'Find the right creators for your brand and start your next influencer marketing campaign with Share Your Party.',
    alternates: localeAlternates('/creator-events', 'en'),
    openGraph: {
      title: 'Creator Marketing for Businesses — Share Your Party',
      description: 'We connect your brand with creators who truly reach your target audience.',
      url,
      type: 'website',
    },
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Creator Marketing for Businesses',
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
          name: 'Product & Location Reviews',
        },
      },
    ],
  },
}

export default async function CreatorEventsRouteEN() {
  // Fetched on the server and passed down as a prop: CreatorEventsPage is a
  // client component (contact form) and must not talk to the CMS itself.
  // fetchCaseStudiesSafe swallows errors and returns an empty array — the
  // section then renders nothing and the page stays intact.
  const cases = await fetchCaseStudiesSafe('en')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CreatorEventsPage cases={cases} />
    </>
  )
}
