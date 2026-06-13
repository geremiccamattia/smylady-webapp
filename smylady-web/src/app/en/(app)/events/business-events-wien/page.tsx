import type { Metadata } from 'next'
import BusinessEventsWien from '@/views/BusinessEventsWien'

export const metadata: Metadata = {
  title: 'Business Events Vienna 2026 – Networking & Conferences | Share Your Party',
  description: 'All business events in Vienna 2026 at a glance – buy tickets directly, discover events ► Now on Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/en/events/business-events-wien',
  },
}

export default function BusinessEventsWienEnPage() {
  return <BusinessEventsWien />
}
