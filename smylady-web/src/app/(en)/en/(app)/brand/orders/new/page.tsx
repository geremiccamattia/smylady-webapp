import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandOrderForm from '@/views/brand/BrandOrderForm'

export const metadata: Metadata = {
  title: 'New order',
  description: 'Describe your event and what you expect from creators.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand/orders/new', 'en'),
}

export default function BrandOrderNewEnPage() {
  return <BrandOrderForm />
}
