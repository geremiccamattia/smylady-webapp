import type { Metadata } from 'next'
import ClubbingWien from '@/views/ClubbingWien'

export const metadata: Metadata = {
  title: 'Clubbing Vienna 2026 – All Club Events',
  description: 'The best clubbing events in Vienna 2026 – buy tickets, discover events ► Now on Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/en/events/clubbing-wien',
  },
}

export default function ClubbingWienEnPage() {
  return <ClubbingWien />
}
