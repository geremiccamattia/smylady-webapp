import type { Metadata } from 'next'
import WorkshopsWien from '@/views/WorkshopsWien'

export const metadata: Metadata = {
  title: 'Workshops Vienna 2026 – Creative, Business & Wellness | Share Your Party',
  description: 'All workshops in Vienna 2026 at a glance – buy tickets directly, discover events ► Now on Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/en/events/workshops-wien',
  },
}

export default function WorkshopsWienEnPage() {
  return <WorkshopsWien />
}
