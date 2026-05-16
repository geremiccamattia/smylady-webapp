import { Suspense } from 'react'
import type { Metadata } from 'next'
import ExploreClient from '@/views/Explore'

export const metadata: Metadata = {
  title: 'Events entdecken',
  description: 'Entdecke Partys, Konzerte und Festivals in deiner Nähe auf Share Your Party.',
  alternates: { canonical: 'https://shareyourparty.de/explore' },
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreClient />
    </Suspense>
  )
}
