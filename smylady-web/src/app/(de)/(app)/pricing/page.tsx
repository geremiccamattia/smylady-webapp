import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Pricing from '@/views/legal/Pricing'
export const metadata: Metadata = { title: 'Preise', alternates: localeAlternates('/pricing', 'de') }
export default function PricingPage() { return <Pricing /> }