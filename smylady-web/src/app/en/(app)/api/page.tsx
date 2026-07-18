import type { Metadata } from 'next'
import ApiDocsPage from '@/views/ApiDocsPage'

export const metadata: Metadata = {
  title: 'API Documentation for Organizers — Share Your Party',
  description: 'Create and manage events automatically via the Share Your Party API. Documentation for organizers and partners.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://shareyourparty.de/en/api',
    languages: { 'de': 'https://shareyourparty.de/api' }
  },
}

export default function ApiDocsEN() {
  return <ApiDocsPage />
}
