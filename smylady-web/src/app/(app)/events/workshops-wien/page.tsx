import type { Metadata } from 'next'
import WorkshopsWien from '@/views/WorkshopsWien'

export const metadata: Metadata = {
  title: 'Workshops Wien 2026 – Kreativ, Business & Wellness | Share Your Party',
  description: 'Alle Workshops in Wien 2026 auf einen Blick – Tickets direkt kaufen, Events entdecken ► Jetzt auf Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/events/workshops-wien',
  },
}

export default function WorkshopsWienPage() {
  return <WorkshopsWien />
}
