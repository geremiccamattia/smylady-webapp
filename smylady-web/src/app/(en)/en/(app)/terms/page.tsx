import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Terms from '@/views/legal/Terms'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Terms and conditions of Share Your Party.',
  alternates: localeAlternates('/terms', 'en'),
}

export default function TermsPageEN() {
  return <Terms lang="en" />
}
