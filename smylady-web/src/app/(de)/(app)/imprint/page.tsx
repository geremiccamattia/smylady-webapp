import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Impressum from '@/views/legal/Impressum'
export const metadata: Metadata = { title: 'Impressum', alternates: localeAlternates('/imprint', 'de') }
export default function ImprintPage() { return <Impressum /> }
