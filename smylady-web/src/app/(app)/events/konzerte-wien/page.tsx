import type { Metadata } from 'next'
import KonzerteWien from '@/views/KonzerteWien'

export const metadata: Metadata = {
  title: 'Konzerte in Wien 2026 – Alle Konzerttermine | Share Your Party',
  description:
    'Entdecke die besten Konzerte in Wien 2026. Aktuelle Konzerttermine, Tickets und Live-Events in Wien auf Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/events/konzerte-wien',
  },
}

export default function KonzerteWienPage() {
  return <KonzerteWien />
}
