import type { Metadata } from 'next'
import Privacy from '@/views/legal/Privacy'
export const metadata: Metadata = { title: 'Datenschutz', alternates: {
    canonical: 'https://shareyourparty.de/privacy',
    languages: { 'en': 'https://shareyourparty.de/en/privacy' }
  } }
export default function PrivacyPage() { return <Privacy /> }