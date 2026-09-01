import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Pricing from '@/views/legal/Pricing'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pricing and conditions of Share Your Party.',
  alternates: localeAlternates('/pricing', 'en'),
}

export default function PricingPageEN() {
  return <Pricing />
}
