import type { Metadata } from 'next'
import ClubbingWien from '@/views/ClubbingWien'

export const metadata: Metadata = {
  title: 'Clubbing Wien 2026 – Alle Club Events',
  description: 'Die besten Clubbing Events in Wien 2026 – Tickets kaufen, Events entdecken ► Jetzt auf Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/events/clubbing-wien',
  },
}

export default function ClubbingWienPage() {
  return <ClubbingWien />
}
