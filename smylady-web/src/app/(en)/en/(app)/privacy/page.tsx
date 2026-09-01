import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import Privacy from '@/views/legal/Privacy'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy of Share Your Party.',
  alternates: localeAlternates('/privacy', 'en'),
}

export default function PrivacyPageEN() {
  return <Privacy />
}
