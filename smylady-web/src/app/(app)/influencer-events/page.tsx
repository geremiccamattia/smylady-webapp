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

export default function InfluencerEventsRoute() {
  return <InfluencerEventsPage />
}
