import type { Metadata } from 'next'
import Explore from '@/views/Explore'

export const metadata: Metadata = {
  title: 'Discover Events',
  description: 'Discover parties, concerts and festivals near you. Find your next experience on Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/explore',
    languages: { 'de': 'https://shareyourparty.de/explore' }
  },
}

export default function ExplorePageEN() {
  return <Explore />
}
