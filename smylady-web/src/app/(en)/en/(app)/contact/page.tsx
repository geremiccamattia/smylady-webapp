import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Contact from '@/views/legal/Contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Share Your Party.',
  alternates: localeAlternates('/contact', 'en'),
}

export default function ContactPageEN() {
  return <Contact />
}
