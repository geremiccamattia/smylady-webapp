import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Terms from '@/views/legal/Terms'
export const metadata: Metadata = { title: 'AGB', alternates: localeAlternates('/terms', 'de') }
export default function TermsPage() { return <Terms lang="de" /> }