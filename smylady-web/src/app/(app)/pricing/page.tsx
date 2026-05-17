import type { Metadata } from 'next'
import Pricing from '@/views/legal/Pricing'
export const metadata: Metadata = { title: 'Preise', alternates: {
    canonical: 'https://shareyourparty.de/pricing',
    languages: { 'en': 'https://shareyourparty.de/en/pricing' }
  } }
export default function PricingPage() { return <Pricing /> }