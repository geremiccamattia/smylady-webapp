import type { Metadata } from 'next'
import Impressum from '@/views/legal/Impressum'
export const metadata: Metadata = { title: 'Impressum', alternates: {
    canonical: 'https://shareyourparty.de/imprint',
    languages: { 'en': 'https://shareyourparty.de/en/imprint' }
  } }
export default function ImprintPage() { return <Impressum /> }
