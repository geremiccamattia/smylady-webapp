import type { Metadata } from 'next'
import Impressum from '@/views/legal/Impressum'

export const metadata: Metadata = {
  title: 'Imprint',
  description: 'Imprint of Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/imprint',
    languages: { 'de': 'https://shareyourparty.de/imprint' }
  },
}

export default function ImpressumPageEN() {
  return <Impressum />
}
