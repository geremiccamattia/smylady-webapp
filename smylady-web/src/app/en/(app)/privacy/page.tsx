import type { Metadata } from 'next'
import Privacy from '@/views/legal/Privacy'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy of Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/privacy',
    languages: { 'de': 'https://shareyourparty.de/privacy' }
  },
}

export default function PrivacyPageEN() {
  return <Privacy />
}
