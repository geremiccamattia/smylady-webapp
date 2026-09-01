import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import ApiDocsPage from '@/views/ApiDocsPage'

export const metadata: Metadata = {
  title: 'API Documentation for Organizers — Share Your Party',
  description: 'Create and manage events automatically via the Share Your Party API. Documentation for organizers and partners.',
  robots: { index: true, follow: true },
  alternates: localeAlternates('/api', 'en'),
}

export default function ApiDocsEN() {
  return <ApiDocsPage />
}
