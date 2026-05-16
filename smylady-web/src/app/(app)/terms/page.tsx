import type { Metadata } from 'next'
import Terms from '@/views/legal/Terms'
export const metadata: Metadata = { title: 'Nutzungsbedingungen', alternates: { canonical: 'https://shareyourparty.de/terms' } }
export default function TermsPage() { return <Terms /> }