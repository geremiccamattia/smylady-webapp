import type { Metadata } from 'next'
import InfluencerClubPage from '@/views/InfluencerClubPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/influencer-club'
  return {
    title: 'Influencer Club — Share Your Party',
    description: 'Werde Teil des Share Your Party Influencer Clubs. Exklusive Events, VIP Access, Community und faire Kooperationen.',
    alternates: {
      canonical: url,
      languages: { en: 'https://shareyourparty.de/en/influencer-club' },
    },
    openGraph: {
      title: 'Share Your Party Influencer Club 🎉',
      description: 'Werde Creator bei Share Your Party — exklusive Events, VIP Access und faire Vergütungen.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/images/influencer/hero.jpg' }],
    },
  }
}

export default function InfluencerClubRoute() {
  return <InfluencerClubPage />
}
