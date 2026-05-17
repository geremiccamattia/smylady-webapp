import type { Metadata } from 'next'
import Contact from '@/views/legal/Contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Share Your Party.',
  alternates: {
    canonical: 'https://shareyourparty.de/en/contact',
    languages: { 'de': 'https://shareyourparty.de/contact' }
  },
}

export default function ContactPageEN() {
  return <Contact />
}
