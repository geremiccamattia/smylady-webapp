import type { Metadata } from 'next'
import Terms from '@/views/legal/Terms'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service of Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/terms',
    languages: { 'de': 'https://shareyourparty.de/terms' }
  },
}

export default function TermsPageEN() {
  return <Terms />
}
