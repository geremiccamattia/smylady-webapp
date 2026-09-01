import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Explore from '@/views/Explore'

export const metadata: Metadata = {
  title: 'Discover Events',
  description: 'Discover parties, concerts and festivals near you. Find your next experience on Share Your Party.',
  alternates: localeAlternates('/explore', 'en'),
}

export default function ExplorePageEN() {
  return <Explore />
}
