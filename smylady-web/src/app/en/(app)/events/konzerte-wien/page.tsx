import type { Metadata } from 'next'
import KonzerteWien from '@/views/KonzerteWien'

export const metadata: Metadata = {
  title: 'Concerts in Vienna 2026 – All Concert Dates',
  description: 'All concerts in Vienna 2026 at a glance – buy tickets directly, discover events and share experiences ► Now on Share Your Party!',
  alternates: {
    canonical: 'https://shareyourparty.de/en/events/konzerte-wien',
  },
}

export default function KonzerteWienEnPage() {
  return <KonzerteWien />
}
