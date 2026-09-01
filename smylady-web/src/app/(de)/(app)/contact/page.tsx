import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Contact from '@/views/legal/Contact'
export const metadata: Metadata = { title: 'Kontakt', alternates: localeAlternates('/contact', 'de') }
export default function ContactPage() { return <Contact /> }