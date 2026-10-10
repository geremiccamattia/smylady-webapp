import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import BrandDashboard from '@/views/brand/BrandDashboard'

export const metadata: Metadata = {
  title: 'Brand Dashboard',
  description: 'Your creator orders at a glance.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/brand', 'en'),
}

export default function BrandDashboardEnPage() {
  return <BrandDashboard />
}
