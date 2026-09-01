import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import ApiDocsPage from '@/views/ApiDocsPage'

export const metadata: Metadata = {
  title: 'API-Dokumentation für Veranstalter — Share Your Party',
  description: 'Events automatisiert erstellen und verwalten über die Share Your Party API. Dokumentation für Veranstalter und Partner.',
  robots: { index: true, follow: true },
  alternates: localeAlternates('/api', 'de'),
}

export default function ApiDocs() {
  return <ApiDocsPage />
}
