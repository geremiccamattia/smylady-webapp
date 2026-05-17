import type { Metadata } from 'next'
import Pricing from '@/views/legal/Pricing'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pricing and conditions of Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/pricing',
    languages: { 'de': 'https://shareyourparty.de/pricing' }
  },
}

export default function PricingPageEN() {
  return <Pricing />
}
