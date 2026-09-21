import { Suspense } from 'react'
import { localeAlternates } from '@/lib/seo'
import type { Metadata } from 'next'
import ExploreClient from '@/views/Explore'

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ search?: string }> }
): Promise<Metadata> {
  const { search } = await searchParams
  const base = {
    description: 'Entdecke Partys, Konzerte und Festivals in deiner Nähe auf Share Your Party.',
    alternates: localeAlternates('/explore', 'de'),
  }
  if (search) {
    return { ...base, robots: { index: false, follow: true } }
  }
  // Ohne Brand-Suffix — den hängt das Template im Root-Layout an. Die englische
  // Fassung war bereits richtig ('Discover Events').
  return { ...base, title: 'Events entdecken' }
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreClient />
    </Suspense>
  )
}
