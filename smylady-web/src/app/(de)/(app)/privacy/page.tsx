import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Privacy from '@/views/legal/Privacy'
export const metadata: Metadata = { title: 'Datenschutz', alternates: localeAlternates('/privacy', 'de') }
export default function PrivacyPage() { return <Privacy /> }