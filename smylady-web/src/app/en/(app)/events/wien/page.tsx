import type { Metadata } from 'next'
import WienEvents from '@/views/WienEvents'

export const metadata: Metadata = {
  title: 'Events in Vienna',
  description: 'All parties, concerts and festivals in Vienna – discover events in your city.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/events/wien',
    languages: { 'de': 'https://shareyourparty.de/events/wien' }
  },
}

export default function WienEventsPageEN() {
  return <WienEvents />
}
