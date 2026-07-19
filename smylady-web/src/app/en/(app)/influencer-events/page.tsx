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

export default function InfluencerEventsRouteEN() {
  return <InfluencerEventsPage />
}
