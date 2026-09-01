import type { Metadata } from 'next'
import BusinessEventsWien from '@/views/BusinessEventsWien'

export const metadata: Metadata = {
  title: 'Business Events Wien 2026 – Networking & Konferenzen | Share Your Party',
  description: 'Alle Business Events in Wien 2026 auf einen Blick – Tickets direkt kaufen, Events entdecken ► Jetzt auf Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/events/business-events-wien',
  },
}

export default function BusinessEventsWienPage() {
  return <BusinessEventsWien />
}
