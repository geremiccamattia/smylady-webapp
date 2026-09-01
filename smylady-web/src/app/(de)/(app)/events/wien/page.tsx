import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import WienEventsClient from '@/views/WienEvents'

export const metadata: Metadata = {
  title: 'Events in Wien',
  description: 'Alle Partys, Konzerte und Festivals in Wien – entdecke Events in deiner Stadt.',
  alternates: localeAlternates('/events/wien', 'de'),
}

export default function WienEventsPage() {
  return <WienEventsClient />
}
