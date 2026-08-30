import type { Metadata } from 'next'
import CreatorClubPage from '@/views/CreatorClubPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/en/creator-club'
  return {
    title: 'Creator Club — Share Your Party',
    description: 'Become part of the Share Your Party Creator Club. Exclusive events, VIP access, community and fair collaborations.',
    alternates: {
      canonical: url,
      languages: { de: 'https://shareyourparty.de/creator-club' },
    },
    openGraph: {
      title: 'Share Your Party Creator Club 🎉',
      description: 'Become a creator at Share Your Party — exclusive events, VIP access and fair compensation.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/images/influencer/hero.jpg' }],
    },
  }
}

export default function CreatorClubRouteEN() {
  return <CreatorClubPage />
}
