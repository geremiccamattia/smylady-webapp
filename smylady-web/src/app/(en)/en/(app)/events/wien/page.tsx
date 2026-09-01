import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import WienEvents from '@/views/WienEvents'

export const metadata: Metadata = {
  title: 'Events in Vienna',
  description: 'All parties, concerts and festivals in Vienna – discover events in your city.',
  alternates: localeAlternates('/events/wien', 'en'),
}

export default function WienEventsPageEN() {
  return <WienEvents />
}
