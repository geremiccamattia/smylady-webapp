import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import CreatorDashboard from '@/views/creator/CreatorDashboard'

export const metadata: Metadata = {
  title: 'Creator area',
  description: 'Your brand requests and your profile.',
  robots: { index: false, follow: false },
  alternates: localeAlternates('/creator', 'en'),
}

export default function CreatorDashboardEnPage() {
  return <CreatorDashboard />
}
