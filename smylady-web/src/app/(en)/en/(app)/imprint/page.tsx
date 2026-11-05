import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Impressum from '@/views/legal/Impressum'

export const metadata: Metadata = {
  title: 'Legal Notice',
  description: 'Legal notice (Impressum) of Share Your Party.',
  alternates: localeAlternates('/imprint', 'en'),
}

export default function ImpressumPageEN() {
  return <Impressum lang="en" />
}
