import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorClubPage from '@/views/CreatorClubPage'

export async function generateMetadata(): Promise<Metadata> {
  const url = 'https://shareyourparty.de/creator-club'
  return {
    title: 'Creator Club — Share Your Party',
    description: 'Werde Teil des Share Your Party Creator Clubs. Exklusive Events, VIP Access, Community und faire Kooperationen.',
    alternates: localeAlternates('/creator-club', 'de'),
    openGraph: {
      title: 'Share Your Party Creator Club 🎉',
      description: 'Werde Creator bei Share Your Party — exklusive Events, VIP Access und faire Vergütungen.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/images/influencer/hero.jpg' }],
    },
  }
}

export default function CreatorClubRoute() {
  return <CreatorClubPage />
}
