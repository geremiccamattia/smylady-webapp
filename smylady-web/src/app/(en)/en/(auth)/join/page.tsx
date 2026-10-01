import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import SignupChoice from '@/views/auth/SignupChoice'

// See the German route for why this page is noindex and not in the sitemap.
export const metadata: Metadata = {
  title: 'Join',
  description: 'Choose how you want to join Share Your Party: as a guest, a creator or a brand.',
  robots: { index: false, follow: true },
  alternates: localeAlternates('/join', 'en'),
}

export default function JoinEnPage() {
  return <SignupChoice />
}
