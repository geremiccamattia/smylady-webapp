import type { Metadata } from 'next'
import InfluencerClubPage from '@/views/InfluencerClubPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/en/influencer-club'
  return {
    title: 'Influencer Club — Share Your Party',
    description: 'Become part of the Share Your Party Influencer Club. Exclusive events, VIP access, community and fair collaborations.',
    alternates: {
      canonical: url,
      languages: { de: 'https://shareyourparty.de/influencer-club' },
    },
    openGraph: {
      title: 'Share Your Party Influencer Club 🎉',
      description: 'Become a creator at Share Your Party — exclusive events, VIP access and fair compensation.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/images/influencer/hero.jpg' }],
    },
  }
}

export default function InfluencerClubRouteEN() {
  return <InfluencerClubPage />
}
