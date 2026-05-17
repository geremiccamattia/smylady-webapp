import type { Metadata } from 'next'
import WienEventsClient from '@/views/WienEvents'

export const metadata: Metadata = {
  title: 'Events in Wien',
  description: 'Alle Partys, Konzerte und Festivals in Wien – entdecke Events in deiner Stadt.',
  alternates: {
    canonical: 'https://shareyourparty.de/events/wien',
    languages: { 'en': 'https://shareyourparty.de/en/events/wien' }
  },
}

export default function WienEventsPage() {
  return <WienEventsClient />
}
