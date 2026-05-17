import type { Metadata } from 'next'
import Contact from '@/views/legal/Contact'
export const metadata: Metadata = { title: 'Kontakt', alternates: {
    canonical: 'https://shareyourparty.de/contact',
    languages: { 'en': 'https://shareyourparty.de/en/contact' }
  } }
export default function ContactPage() { return <Contact /> }