import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
// @ts-ignore
import GroundingPage from '@/views/GroundingPage'

export const metadata: Metadata = {
  title: 'About Share Your Party',
  description: 'Learn more about Share Your Party.',
  alternates: localeAlternates('/grounding', 'en'),
}

export default function GroundingPagePageEN() {
  return <GroundingPage />
}
