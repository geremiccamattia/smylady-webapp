import type { Metadata } from 'next'
// @ts-ignore
import GroundingPage from '@/views/GroundingPage'

export const metadata: Metadata = {
  title: 'About Share Your Party',
  description: 'Learn more about Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/grounding',
    languages: { 'de': 'https://shareyourparty.de/grounding' }
  },
}

export default function GroundingPagePageEN() {
  return <GroundingPage />
}
